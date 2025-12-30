import { NextRequest, NextResponse } from 'next/server';

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { z } from 'zod';

import { auth } from '~/lib/auth/auth';
import { badRequest, forbidden, unauthorized } from '~/lib/api/responses';


const querySchema = z.object({
  type: z.enum(['balances', 'requests', 'summary']),
  year: z.coerce.number().min(2020).max(2030).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

/**
 * GET /api/reports/export
 * Export report data as CSV
 */
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return unauthorized();
  }

  const searchParams = request.nextUrl.searchParams;
  const query = querySchema.safeParse({
    type: searchParams.get('type'),
    year: searchParams.get('year') ?? undefined,
    startDate: searchParams.get('startDate') ?? undefined,
    endDate: searchParams.get('endDate') ?? undefined,
  });

  if (!query.success) {
    return new NextResponse('Invalid parameters', { status: 400 });
  }

  const { type, year, startDate, endDate } = query.data;
  const { env } = getCloudflareContext();
  const db = env.DB;

  // Get user's organization membership and verify role
  const membership = await db
    .prepare(
      `SELECT om.organization_id, om.role
       FROM organization_members om
       WHERE om.user_id = ? AND om.status = 'active'
       LIMIT 1`
    )
    .bind(session.user.id)
    .first<{ organization_id: string; role: string }>();

  if (!membership) {
    return badRequest('You are not a member of any organization');
  }

  if (!['admin', 'manager', 'hr'].includes(membership.role)) {
    return forbidden('Only admins, managers, and HR can export reports');
  }

  const effectiveYear = year ?? new Date().getFullYear();
  const effectiveStartDate = startDate ?? `${effectiveYear}-01-01`;
  const effectiveEndDate = endDate ?? `${effectiveYear}-12-31`;

  let csvContent = '';
  let filename = '';

  if (type === 'balances') {
    // Export employee balances
    const result = await db
      .prepare(
        `SELECT
          u.name,
          u.email,
          om.role,
          lt.name_en as leave_type,
          lb.entitled,
          lb.carried_over,
          lb.adjustment,
          lb.used,
          lb.pending,
          (lb.entitled + lb.carried_over + lb.adjustment - lb.used - lb.pending) as remaining
        FROM organization_members om
        JOIN users u ON om.user_id = u.id
        LEFT JOIN leave_balances lb ON om.user_id = lb.user_id AND lb.year = ?
        LEFT JOIN leave_types lt ON lb.leave_type_id = lt.id
        WHERE om.organization_id = ? AND om.status = 'active'
        ORDER BY u.name, lt.name_en`
      )
      .bind(effectiveYear, membership.organization_id)
      .all<Record<string, unknown>>();

    csvContent =
      'Name,Email,Role,Leave Type,Entitled,Carried Over,Adjustment,Used,Pending,Remaining\n';
    result.results.forEach((row: Record<string, unknown>) => {
      csvContent += `"${row.name || ''}","${row.email}","${row.role}","${row.leave_type || ''}",${row.entitled ?? ''},${row.carried_over ?? ''},${row.adjustment ?? ''},${row.used ?? ''},${row.pending ?? ''},${row.remaining ?? ''}\n`;
    });

    filename = `leave-balances-${effectiveYear}.csv`;
  } else if (type === 'requests') {
    // Export leave requests
    const result = await db
      .prepare(
        `SELECT
          u.name,
          u.email,
          lt.name_en as leave_type,
          lr.start_date,
          lr.end_date,
          lr.work_days,
          lr.status,
          lr.reason,
          lr.submitted_at
        FROM leave_requests lr
        JOIN users u ON lr.user_id = u.id
        JOIN leave_types lt ON lr.leave_type_id = lt.id
        WHERE lr.organization_id = ?
          AND lr.start_date >= ?
          AND lr.end_date <= ?
        ORDER BY lr.submitted_at DESC`
      )
      .bind(membership.organization_id, effectiveStartDate, effectiveEndDate)
      .all<Record<string, unknown>>();

    csvContent =
      'Name,Email,Leave Type,Start Date,End Date,Work Days,Status,Reason,Submitted At\n';
    result.results.forEach((row: Record<string, unknown>) => {
      const reason = String(row.reason || '').replace(/"/g, '""');
      csvContent += `"${row.name || ''}","${row.email}","${row.leave_type}","${row.start_date}","${row.end_date}",${row.work_days},"${row.status}","${reason}","${row.submitted_at}"\n`;
    });

    filename = `leave-requests-${effectiveStartDate}-to-${effectiveEndDate}.csv`;
  } else {
    // Export summary
    const usageByType = await db
      .prepare(
        `SELECT
          lt.name_en as leave_type,
          COUNT(lr.id) as request_count,
          COALESCE(SUM(lr.work_days), 0) as total_days,
          COUNT(CASE WHEN lr.status = 'approved' THEN 1 END) as approved,
          COUNT(CASE WHEN lr.status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN lr.status = 'rejected' THEN 1 END) as rejected
        FROM leave_types lt
        LEFT JOIN leave_requests lr ON lt.id = lr.leave_type_id
          AND lr.organization_id = ?
          AND lr.start_date >= ?
          AND lr.end_date <= ?
        WHERE lt.organization_id IS NULL OR lt.organization_id = ?
        GROUP BY lt.id
        ORDER BY total_days DESC`
      )
      .bind(
        membership.organization_id,
        effectiveStartDate,
        effectiveEndDate,
        membership.organization_id
      )
      .all<Record<string, unknown>>();

    csvContent =
      'Leave Type,Total Requests,Total Days,Approved,Pending,Rejected\n';
    usageByType.results.forEach((row: Record<string, unknown>) => {
      csvContent += `"${row.leave_type}",${row.request_count},${row.total_days},${row.approved},${row.pending},${row.rejected}\n`;
    });

    filename = `leave-summary-${effectiveStartDate}-to-${effectiveEndDate}.csv`;
  }

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
