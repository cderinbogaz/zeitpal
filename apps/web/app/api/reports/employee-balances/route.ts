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
  teamId: z.string().optional(),
  leaveTypeId: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(10).max(100).default(25),
  sortBy: z.enum(['name', 'entitled', 'used', 'remaining']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * GET /api/reports/employee-balances
 * Get employee leave balances for the organization
 */
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return unauthorized();
  }

  const searchParams = request.nextUrl.searchParams;
  const query = querySchema.safeParse({
    year: searchParams.get('year') ?? undefined,
    teamId: searchParams.get('teamId') ?? undefined,
    leaveTypeId: searchParams.get('leaveTypeId') ?? undefined,
    page: searchParams.get('page') ?? undefined,
    pageSize: searchParams.get('pageSize') ?? undefined,
    sortBy: searchParams.get('sortBy') ?? undefined,
    sortOrder: searchParams.get('sortOrder') ?? undefined,
  });

  if (!query.success) {
    return validationError(query.error.flatten());
  }

  const { year, teamId, leaveTypeId, page, pageSize, sortBy, sortOrder } =
    query.data;
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

  // Get vacation leave type (code = 'vacation')
  const vacationType = await db
    .prepare(
      `SELECT id FROM leave_types
       WHERE code = 'vacation'
         AND (organization_id IS NULL OR organization_id = ?)
       LIMIT 1`
    )
    .bind(membership.organization_id)
    .first<{ id: string }>();

  const effectiveLeaveTypeId = leaveTypeId ?? vacationType?.id;

  // Build the query for employee balances
  let countQuery = `
    SELECT COUNT(DISTINCT om.user_id) as total
    FROM organization_members om
    JOIN users u ON om.user_id = u.id
  `;

  let dataQuery = `
    SELECT
      u.id as user_id,
      u.name,
      u.email,
      om.role,
      lb.entitled,
      lb.carried_over,
      lb.adjustment,
      lb.used,
      lb.pending,
      (lb.entitled + lb.carried_over + lb.adjustment - lb.used - lb.pending) as remaining,
      lt.name_en as leave_type_name,
      lt.code as leave_type_code
    FROM organization_members om
    JOIN users u ON om.user_id = u.id
    LEFT JOIN leave_balances lb ON om.user_id = lb.user_id
      AND lb.year = ?
      ${effectiveLeaveTypeId ? 'AND lb.leave_type_id = ?' : ''}
    LEFT JOIN leave_types lt ON lb.leave_type_id = lt.id
  `;

  const params: (string | number)[] = [effectiveYear];
  if (effectiveLeaveTypeId) {
    params.push(effectiveLeaveTypeId);
  }

  let whereClause = ' WHERE om.organization_id = ? AND om.status = ?';
  params.push(membership.organization_id, 'active');

  if (teamId) {
    whereClause += ' AND om.user_id IN (SELECT user_id FROM team_members WHERE team_id = ?)';
    params.push(teamId);
  }

  countQuery += whereClause;
  dataQuery += whereClause;

  // Add sorting
  const sortColumn =
    sortBy === 'name'
      ? 'u.name'
      : sortBy === 'entitled'
        ? 'lb.entitled'
        : sortBy === 'used'
          ? 'lb.used'
          : 'remaining';
  dataQuery += ` ORDER BY ${sortColumn} ${sortOrder.toUpperCase()} NULLS LAST`;

  // Add pagination
  const offset = (page - 1) * pageSize;
  dataQuery += ` LIMIT ? OFFSET ?`;

  // Get total count (with only base params)
  const countParams = teamId
    ? [membership.organization_id, 'active', teamId]
    : [membership.organization_id, 'active'];
  const totalResult = await db
    .prepare(countQuery)
    .bind(...countParams)
    .first<{ total: number }>();

  // Get data
  const dataParams = [...params, pageSize, offset];
  const dataResult = await db
    .prepare(dataQuery)
    .bind(...dataParams)
    .all<Record<string, unknown>>();

  const employees = dataResult.results.map((row: Record<string, unknown>) => ({
    userId: row.user_id,
    name: row.name || row.email,
    email: row.email,
    role: row.role,
    leaveType: row.leave_type_name
      ? {
          name: row.leave_type_name,
          code: row.leave_type_code,
        }
      : null,
    balance: row.entitled !== null
      ? {
          entitled: row.entitled,
          carriedOver: row.carried_over,
          adjustment: row.adjustment,
          used: row.used,
          pending: row.pending,
          remaining: row.remaining,
        }
      : null,
  }));

  return success({
    employees,
    pagination: {
      page,
      pageSize,
      total: totalResult?.total ?? 0,
      totalPages: Math.ceil((totalResult?.total ?? 0) / pageSize),
    },
    filters: {
      year: effectiveYear,
      teamId,
      leaveTypeId: effectiveLeaveTypeId,
    },
  });
}
