import { NextRequest } from 'next/server';

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { z } from 'zod';

import { auth } from '~/lib/auth/auth';
import {
  badRequest,
  forbidden,
  success,
  unauthorized,
  validationError,
} from '~/lib/api/responses';


const querySchema = z.object({
  year: z.coerce.number().min(2020).max(2030).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  teamId: z.string().optional(),
  leaveTypeId: z.string().optional(),
});

/**
 * GET /api/reports/leave-summary
 * Get leave usage summary for the organization
 */
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return unauthorized();
  }

  const searchParams = request.nextUrl.searchParams;
  const query = querySchema.safeParse({
    year: searchParams.get('year') ?? undefined,
    startDate: searchParams.get('startDate') ?? undefined,
    endDate: searchParams.get('endDate') ?? undefined,
    teamId: searchParams.get('teamId') ?? undefined,
    leaveTypeId: searchParams.get('leaveTypeId') ?? undefined,
  });

  if (!query.success) {
    return validationError(query.error.flatten());
  }

  const { year, startDate, endDate, teamId: _teamId, leaveTypeId } = query.data;
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
    return forbidden('Only admins, managers, and HR can view reports');
  }

  const effectiveYear = year ?? new Date().getFullYear();
  const effectiveStartDate = startDate ?? `${effectiveYear}-01-01`;
  const effectiveEndDate = endDate ?? `${effectiveYear}-12-31`;

  // Get leave usage by type
  let usageByTypeQuery = `
    SELECT
      lt.id as leave_type_id,
      lt.code,
      lt.name_en,
      lt.name_de,
      lt.color,
      COUNT(lr.id) as request_count,
      COALESCE(SUM(lr.work_days), 0) as total_days,
      COUNT(CASE WHEN lr.status = 'approved' THEN 1 END) as approved_count,
      COUNT(CASE WHEN lr.status = 'pending' THEN 1 END) as pending_count,
      COUNT(CASE WHEN lr.status = 'rejected' THEN 1 END) as rejected_count
    FROM leave_types lt
    LEFT JOIN leave_requests lr ON lt.id = lr.leave_type_id
      AND lr.organization_id = ?
      AND lr.start_date >= ?
      AND lr.end_date <= ?
      AND lr.status != 'cancelled'
  `;

  const usageParams: (string | number)[] = [
    membership.organization_id,
    effectiveStartDate,
    effectiveEndDate,
  ];

  if (leaveTypeId) {
    usageByTypeQuery += ' AND lt.id = ?';
    usageParams.push(leaveTypeId);
  }

  usageByTypeQuery += `
    WHERE lt.organization_id IS NULL OR lt.organization_id = ?
    GROUP BY lt.id
    ORDER BY total_days DESC
  `;
  usageParams.push(membership.organization_id);

  const usageByType = await db
    .prepare(usageByTypeQuery)
    .bind(...usageParams)
    .all<Record<string, unknown>>();

  // Get monthly leave trends
  const monthlyTrendsQuery = `
    SELECT
      strftime('%Y-%m', start_date) as month,
      COUNT(*) as request_count,
      SUM(work_days) as total_days
    FROM leave_requests
    WHERE organization_id = ?
      AND start_date >= ?
      AND end_date <= ?
      AND status != 'cancelled'
    GROUP BY strftime('%Y-%m', start_date)
    ORDER BY month ASC
  `;

  const monthlyTrends = await db
    .prepare(monthlyTrendsQuery)
    .bind(membership.organization_id, effectiveStartDate, effectiveEndDate)
    .all<{ month: string; request_count: number; total_days: number }>();

  // Get overall stats
  const statsQuery = `
    SELECT
      COUNT(*) as total_requests,
      COALESCE(SUM(work_days), 0) as total_days_taken,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_requests,
      COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_requests,
      COUNT(DISTINCT user_id) as employees_with_leave
    FROM leave_requests
    WHERE organization_id = ?
      AND start_date >= ?
      AND end_date <= ?
      AND status != 'cancelled'
  `;

  const stats = await db
    .prepare(statsQuery)
    .bind(membership.organization_id, effectiveStartDate, effectiveEndDate)
    .first<Record<string, unknown>>();

  // Get employees on leave today
  const today = new Date().toISOString().split('T')[0];
  const onLeaveToday = await db
    .prepare(
      `SELECT COUNT(DISTINCT user_id) as count
       FROM leave_requests
       WHERE organization_id = ?
         AND start_date <= ?
         AND end_date >= ?
         AND status = 'approved'`
    )
    .bind(membership.organization_id, today, today)
    .first<{ count: number }>();

  // Get team breakdown (if teams exist)
  const teamBreakdown = await db
    .prepare(
      `SELECT
        t.id as team_id,
        t.name as team_name,
        t.color,
        COUNT(lr.id) as request_count,
        COALESCE(SUM(lr.work_days), 0) as total_days
      FROM teams t
      LEFT JOIN team_members tm ON t.id = tm.team_id
      LEFT JOIN leave_requests lr ON tm.user_id = lr.user_id
        AND lr.start_date >= ?
        AND lr.end_date <= ?
        AND lr.status != 'cancelled'
      WHERE t.organization_id = ?
      GROUP BY t.id
      ORDER BY total_days DESC`
    )
    .bind(effectiveStartDate, effectiveEndDate, membership.organization_id)
    .all<Record<string, unknown>>();

  return success({
    period: {
      startDate: effectiveStartDate,
      endDate: effectiveEndDate,
      year: effectiveYear,
    },
    summary: {
      totalRequests: stats?.total_requests ?? 0,
      totalDaysTaken: stats?.total_days_taken ?? 0,
      pendingRequests: stats?.pending_requests ?? 0,
      approvedRequests: stats?.approved_requests ?? 0,
      employeesWithLeave: stats?.employees_with_leave ?? 0,
      employeesOnLeaveToday: onLeaveToday?.count ?? 0,
    },
    byLeaveType: usageByType.results.map((row: Record<string, unknown>) => ({
      leaveTypeId: row.leave_type_id,
      code: row.code,
      nameEn: row.name_en,
      nameDe: row.name_de,
      color: row.color,
      requestCount: row.request_count,
      totalDays: row.total_days,
      approvedCount: row.approved_count,
      pendingCount: row.pending_count,
      rejectedCount: row.rejected_count,
    })),
    monthlyTrends: monthlyTrends.results.map((row: { month: string; request_count: number; total_days: number }) => ({
      month: row.month,
      requestCount: row.request_count,
      totalDays: row.total_days,
    })),
    byTeam: teamBreakdown.results.map((row: Record<string, unknown>) => ({
      teamId: row.team_id,
      teamName: row.team_name,
      color: row.color,
      requestCount: row.request_count,
      totalDays: row.total_days,
    })),
  });
}
