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
import { sendLeaveRequestRejectedEmail } from '~/lib/emails';


const rejectSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(500),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/leave-requests/[id]/reject
 * Reject a leave request
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return unauthorized();
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = rejectSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error.flatten());
  }

  const { reason } = parsed.data;
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

  // Only admins and managers can reject
  if (currentMembership.role !== 'admin' && currentMembership.role !== 'manager') {
    return forbidden('Only admins and managers can reject leave requests');
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
    return forbidden('Cannot reject leave requests from other organizations');
  }

  // Can only reject pending requests
  if (leaveRequest.status !== 'pending') {
    return badRequest('Can only reject pending leave requests');
  }

  // Cannot reject your own request
  if (leaveRequest.user_id === session.user.id) {
    return badRequest('Cannot reject your own leave request');
  }

  const now = new Date().toISOString();
  const approvalId = crypto.randomUUID();

  // Create rejection record and update leave request in a batch
  await db.batch([
    // Create approval record with rejection
    db
      .prepare(
        `INSERT INTO leave_approvals (
          id, leave_request_id, approver_id, decision, comment, decided_at, created_at
        ) VALUES (?, ?, ?, 'rejected', ?, ?, ?)`
      )
      .bind(approvalId, id, session.user.id, reason, now, now),

    // Update leave request status
    db
      .prepare(
        `UPDATE leave_requests SET status = 'rejected', updated_at = ? WHERE id = ?`
      )
      .bind(now, id),

    // Return pending days to available balance
    db
      .prepare(
        `UPDATE leave_balances
         SET pending = pending - ?,
             updated_at = ?
         WHERE organization_id = ?
           AND user_id = ?
           AND leave_type_id = ?
           AND year = ?`
      )
      .bind(
        leaveRequest.work_days,
        now,
        leaveRequest.organization_id,
        leaveRequest.user_id,
        leaveRequest.leave_type_id,
        new Date(leaveRequest.start_date as string).getFullYear()
      ),
  ]);

  // Get additional data for email
  const leaveType = await db
    .prepare('SELECT code, name_en, name_de FROM leave_types WHERE id = ?')
    .bind(leaveRequest.leave_type_id)
    .first<{ code: string; name_en: string; name_de: string }>();

  const employee = await db
    .prepare('SELECT name, email FROM users WHERE id = ?')
    .bind(leaveRequest.user_id)
    .first<{ name: string; email: string }>();

  const rejecter = await db
    .prepare('SELECT name FROM users WHERE id = ?')
    .bind(session.user.id)
    .first<{ name: string }>();

  // Send rejection notification email to employee using waitUntil
  if (employee && leaveType && rejecter) {
    const rejectionEmailPromise = sendLeaveRequestRejectedEmail(env, {
      employeeName: employee.name || employee.email,
      employeeEmail: employee.email,
      leaveType: leaveType.name_en,
      startDate: leaveRequest.start_date as string,
      endDate: leaveRequest.end_date as string,
      workDays: leaveRequest.work_days as number,
      approverName: rejecter.name,
      rejectionReason: reason,
    }).catch((error) => {
      console.error('Failed to send rejection email:', error);
    });

    ctx.waitUntil(rejectionEmailPromise);
  }

  return success({
    id,
    status: 'rejected',
    rejectedBy: session.user.id,
    rejectedAt: now,
    reason,
  });
}
