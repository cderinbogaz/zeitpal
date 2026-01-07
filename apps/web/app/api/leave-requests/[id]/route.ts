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


interface LeaveRequestRow {
  id: string;
  organization_id: string;
  user_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  start_half_day: string | null;
  end_half_day: string | null;
  work_days: number;
  reason: string | null;
  status: string;
  submitted_at: string;
  created_at: string;
  user_name: string | null;
  user_email: string;
  user_avatar_url: string | null;
  leave_type_code: string;
  leave_type_name_en: string;
  leave_type_name_de: string;
  leave_type_color: string;
}

interface ApprovalRow {
  id: string;
  action: string;
  comment: string | null;
  created_at: string;
  approver_id: string;
  approver_name: string | null;
}

const updateSchema = z.object({
  status: z.enum(['withdrawn', 'cancelled']).optional(),
  reason: z.string().max(500).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/leave-requests/[id]
 * Get a single leave request with details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return unauthorized();
  }

  const { id } = await params;
  const { env } = getCloudflareContext();
  const db = env.DB;

  // Get the leave request
  const leaveRequest = await db
    .prepare(
      `SELECT
        lr.*,
        u.name as user_name,
        u.email as user_email,
        u.image as user_avatar_url,
        lt.code as leave_type_code,
        lt.name_en as leave_type_name_en,
        lt.name_de as leave_type_name_de,
        lt.color as leave_type_color
      FROM leave_requests lr
      JOIN users u ON lr.user_id = u.id
      JOIN leave_types lt ON lr.leave_type_id = lt.id
      WHERE lr.id = ?`
    )
    .bind(id)
    .first<LeaveRequestRow>();

  if (!leaveRequest) {
    return notFound('Leave request not found');
  }

  // Verify user has access (same org)
  const membership = await db
    .prepare(
      `SELECT organization_id FROM organization_members
       WHERE user_id = ? AND status = 'active'
       LIMIT 1`
    )
    .bind(session.user.id)
    .first<{ organization_id: string }>();

  if (membership?.organization_id !== leaveRequest.organization_id) {
    return forbidden('Cannot view leave requests from other organizations');
  }

  // Get approval history
  const approvals = await db
    .prepare(
      `SELECT
        la.*,
        la.decision as action,
        u.name as approver_name
      FROM leave_approvals la
      JOIN users u ON la.approver_id = u.id
      WHERE la.leave_request_id = ?
      ORDER BY la.created_at DESC`
    )
    .bind(id)
    .all<ApprovalRow>();

  return success({
    id: leaveRequest.id,
    status: leaveRequest.status,
    startDate: leaveRequest.start_date,
    endDate: leaveRequest.end_date,
    startHalfDay: leaveRequest.start_half_day,
    endHalfDay: leaveRequest.end_half_day,
    workDays: leaveRequest.work_days,
    reason: leaveRequest.reason,
    submittedAt: leaveRequest.submitted_at,
    createdAt: leaveRequest.created_at,
    user: {
      id: leaveRequest.user_id,
      name: leaveRequest.user_name,
      email: leaveRequest.user_email,
      avatarUrl: leaveRequest.user_avatar_url,
    },
    leaveType: {
      id: leaveRequest.leave_type_id,
      code: leaveRequest.leave_type_code,
      nameEn: leaveRequest.leave_type_name_en,
      nameDe: leaveRequest.leave_type_name_de,
      color: leaveRequest.leave_type_color,
    },
    approvals: approvals.results.map((a: ApprovalRow) => ({
      id: a.id,
      action: a.action,
      comment: a.comment,
      createdAt: a.created_at,
      approver: {
        id: a.approver_id,
        name: a.approver_name,
      },
    })),
  });
}

/**
 * PATCH /api/leave-requests/[id]
 * Update a leave request (withdraw or cancel)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return unauthorized();
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error.flatten());
  }

  const { status, reason: _reason } = parsed.data;
  const { env } = getCloudflareContext();
  const db = env.DB;

  // Get the leave request
  const leaveRequest = await db
    .prepare(`SELECT * FROM leave_requests WHERE id = ?`)
    .bind(id)
    .first<LeaveRequestRow>();

  if (!leaveRequest) {
    return notFound('Leave request not found');
  }

  const membership = await db
    .prepare(
      `SELECT organization_id, role FROM organization_members
       WHERE user_id = ? AND status = 'active'
       LIMIT 1`
    )
    .bind(session.user.id)
    .first<{ organization_id: string; role: string }>();

  if (!membership || membership.organization_id !== leaveRequest.organization_id) {
    return forbidden('Cannot modify leave requests from other organizations');
  }

  const isOwner = leaveRequest.user_id === session.user.id;
  const isAdmin = membership.role === 'admin';

  const now = new Date().toISOString();

  if (status === 'withdrawn') {
    if (!isOwner) {
      return forbidden('Only the request owner can withdraw a leave request');
    }

    // Can only withdraw pending requests
    if (leaveRequest.status !== 'pending') {
      return badRequest('Can only withdraw pending leave requests');
    }

    await db.batch([
      db
        .prepare(`UPDATE leave_requests SET status = 'withdrawn', updated_at = ? WHERE id = ?`)
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
  } else if (status === 'cancelled') {
    if (!isOwner && !isAdmin) {
      return forbidden("Only admins can cancel other members' leave requests");
    }

    // Can only cancel approved requests
    if (leaveRequest.status !== 'approved') {
      return badRequest('Can only cancel approved leave requests');
    }

    await db.batch([
      db
        .prepare(
          `UPDATE leave_requests
           SET status = 'cancelled',
               cancelled_at = ?,
               cancelled_by = ?,
               updated_at = ?
           WHERE id = ?`
        )
        .bind(now, session.user.id, now, id),

      // Return used days to available balance
      db
        .prepare(
          `UPDATE leave_balances
           SET used = used - ?,
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
  } else {
    return badRequest('Invalid status update');
  }

  return success({
    id,
    status,
    updatedAt: now,
  });
}
