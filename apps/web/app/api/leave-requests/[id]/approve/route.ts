import { NextRequest } from 'next/server';

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { z } from 'zod';

import { auth } from '~/lib/auth/auth';
import {
  success,
  unauthorized,
  forbidden,
  notFound,
  badRequest,
  validationError,
} from '~/lib/api/responses';
import {
  sendLeaveRequestApprovedEmail,
  sendTeamAbsenceNotificationEmail,
} from '~/lib/emails';


const approveSchema = z.object({
  comment: z.string().max(500).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/leave-requests/[id]/approve
 * Approve a leave request
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return unauthorized();
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = approveSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error.flatten());
  }

  const { comment } = parsed.data;
  const { env, ctx } = getCloudflareContext();
  const db = env.DB;

  // Get current user's membership
  const currentMembership = await db
    .prepare(
      `SELECT organization_id, role FROM organization_members
       WHERE user_id = ? AND status = 'active'
       LIMIT 1`
    )
    .bind(session.user.id)
    .first<{ organization_id: string; role: string }>();

  if (!currentMembership) {
    return forbidden('Not a member of any organization');
  }

  // Only admins and managers can approve
  if (currentMembership.role !== 'admin' && currentMembership.role !== 'manager') {
    return forbidden('Only admins and managers can approve leave requests');
  }

  // Get the leave request
  const leaveRequest = await db
    .prepare(
      `SELECT lr.*, u.name as user_name
       FROM leave_requests lr
       JOIN users u ON lr.user_id = u.id
       WHERE lr.id = ?`
    )
    .bind(id)
    .first<Record<string, unknown>>();

  if (!leaveRequest) {
    return notFound('Leave request not found');
  }

  // Verify same organization
  if (leaveRequest.organization_id !== currentMembership.organization_id) {
    return forbidden('Cannot approve leave requests from other organizations');
  }

  // Can only approve pending requests
  if (leaveRequest.status !== 'pending') {
    return badRequest('Can only approve pending leave requests');
  }

  // Cannot approve your own request
  if (leaveRequest.user_id === session.user.id) {
    return badRequest('Cannot approve your own leave request');
  }

  const now = new Date().toISOString();
  const approvalId = crypto.randomUUID();

  // Create approval record and update leave request in a batch
  await db.batch([
    // Create approval record
    db
      .prepare(
        `INSERT INTO leave_approvals (
          id, leave_request_id, approver_id, decision, comment, decided_at, created_at
        ) VALUES (?, ?, ?, 'approved', ?, ?, ?)`
      )
      .bind(approvalId, id, session.user.id, comment || null, now, now),

    // Update leave request status
    db
      .prepare(
        `UPDATE leave_requests SET status = 'approved', updated_at = ? WHERE id = ?`
      )
      .bind(now, id),

    // Update leave balance - deduct from pending and add to used
    db
      .prepare(
        `UPDATE leave_balances
         SET pending = pending - ?,
             used = used + ?,
             updated_at = ?
         WHERE organization_id = ?
           AND user_id = ?
           AND leave_type_id = ?
           AND year = ?`
      )
      .bind(
        leaveRequest.work_days,
        leaveRequest.work_days,
        now,
        leaveRequest.organization_id,
        leaveRequest.user_id,
        leaveRequest.leave_type_id,
        new Date(leaveRequest.start_date as string).getFullYear()
      ),
  ]);

  // Get additional data for emails
  const leaveType = await db
    .prepare('SELECT code, name_en, name_de FROM leave_types WHERE id = ?')
    .bind(leaveRequest.leave_type_id)
    .first<{ code: string; name_en: string; name_de: string }>();

  const employee = await db
    .prepare('SELECT name, email FROM users WHERE id = ?')
    .bind(leaveRequest.user_id)
    .first<{ name: string; email: string }>();

  const approver = await db
    .prepare('SELECT name FROM users WHERE id = ?')
    .bind(session.user.id)
    .first<{ name: string }>();

  // Send approval notification email to employee using waitUntil
  if (employee && leaveType && approver) {
    const approvalEmailPromise = sendLeaveRequestApprovedEmail(env, {
      employeeName: employee.name || employee.email,
      employeeEmail: employee.email,
      leaveType: leaveType.name_en,
      startDate: leaveRequest.start_date as string,
      endDate: leaveRequest.end_date as string,
      workDays: leaveRequest.work_days as number,
      approverName: approver.name,
      comment: comment || undefined,
    }).catch((error) => {
      console.error('Failed to send approval email:', error);
    });

    ctx.waitUntil(approvalEmailPromise);

    // Send team absence notifications to team members
    const teamMembers = await db
      .prepare(
        `SELECT DISTINCT u.email, u.name, t.name as team_name
         FROM team_members tm
         JOIN teams t ON tm.team_id = t.id
         JOIN team_members tm2 ON tm.team_id = tm2.team_id
         JOIN users u ON tm2.user_id = u.id
         WHERE tm.user_id = ?
         AND tm2.user_id != ?
         AND t.organization_id = ?`
      )
      .bind(
        leaveRequest.user_id,
        leaveRequest.user_id,
        leaveRequest.organization_id
      )
      .all<{ email: string; name: string; team_name: string }>();

    if (teamMembers.results.length > 0) {
      const teamEmailPromises = teamMembers.results.map((member: { email: string; name: string; team_name: string }) =>
        sendTeamAbsenceNotificationEmail(env, {
          recipientName: member.name || member.email,
          recipientEmail: member.email,
          employeeName: employee.name || employee.email,
          leaveType: leaveType.name_en,
          startDate: leaveRequest.start_date as string,
          endDate: leaveRequest.end_date as string,
          teamName: member.team_name,
        }).catch((error) => {
          console.error(`Failed to send team notification to ${member.email}:`, error);
        })
      );

      ctx.waitUntil(Promise.all(teamEmailPromises));
    }
  }

  return success({
    id,
    status: 'approved',
    approvedBy: session.user.id,
    approvedAt: now,
  });
}
