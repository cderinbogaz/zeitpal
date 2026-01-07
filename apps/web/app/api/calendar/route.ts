import { NextRequest } from 'next/server';

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { z } from 'zod';

import { auth } from '~/lib/auth/auth';
import { badRequest, success, unauthorized, validationError } from '~/lib/api/responses';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format');

const querySchema = z.object({
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  teamId: z.string().optional(),
}).refine((data) => {
  if (!data.startDate && !data.endDate) {
    return true;
  }
  return Boolean(data.startDate && data.endDate);
}, {
  message: 'startDate and endDate must be provided together',
  path: ['endDate'],
}).refine((data) => {
  if (!data.startDate || !data.endDate) {
    return true;
  }
  return new Date(data.endDate) >= new Date(data.startDate);
}, {
  message: 'endDate must be after or equal to startDate',
  path: ['endDate'],
});

interface CalendarRow {
  id: string;
  start_date: string;
  end_date: string;
  user_id: string;
  user_name: string | null;
  user_email: string;
  user_avatar_url: string | null;
  leave_type_code: string;
  leave_type_color: string;
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * GET /api/calendar
 * Get approved leave requests for the calendar view.
 */
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return unauthorized();
  }

  const searchParams = request.nextUrl.searchParams;
  const parsed = querySchema.safeParse({
    startDate: searchParams.get('startDate') ?? undefined,
    endDate: searchParams.get('endDate') ?? undefined,
    teamId: searchParams.get('teamId') ?? undefined,
  });

  if (!parsed.success) {
    return validationError(parsed.error.flatten());
  }

  const { startDate, endDate, teamId } = parsed.data;
  const { env } = getCloudflareContext();
  const db = env.DB;

  const membership = await db
    .prepare(
      `SELECT organization_id
       FROM organization_members
       WHERE user_id = ? AND status = 'active'
       LIMIT 1`
    )
    .bind(session.user.id)
    .first<{ organization_id: string }>();

  if (!membership) {
    return badRequest('You are not a member of any organization');
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const effectiveStartDate = startDate ?? formatDate(monthStart);
  const effectiveEndDate = endDate ?? formatDate(monthEnd);

  let query = `
    SELECT
      lr.id,
      lr.start_date,
      lr.end_date,
      u.id as user_id,
      u.name as user_name,
      u.email as user_email,
      u.image as user_avatar_url,
      lt.code as leave_type_code,
      lt.color as leave_type_color
    FROM leave_requests lr
    JOIN users u ON lr.user_id = u.id
    JOIN leave_types lt ON lr.leave_type_id = lt.id
    WHERE lr.organization_id = ?
      AND lr.status = 'approved'
      AND lr.start_date <= ?
      AND lr.end_date >= ?
  `;

  const params: unknown[] = [
    membership.organization_id,
    effectiveEndDate,
    effectiveStartDate,
  ];

  if (teamId) {
    query += `
      AND EXISTS (
        SELECT 1
        FROM team_members tm
        JOIN teams t ON tm.team_id = t.id
        WHERE tm.user_id = lr.user_id
          AND tm.team_id = ?
          AND t.organization_id = lr.organization_id
      )
    `;
    params.push(teamId);
  }

  query += ' ORDER BY lr.start_date ASC, u.name';

  const result = await db.prepare(query).bind(...params).all<CalendarRow>();

  const absences = (result.results ?? []).map((row: CalendarRow) => ({
    id: row.id,
    startDate: row.start_date,
    endDate: row.end_date,
    user: {
      id: row.user_id,
      name: row.user_name,
      email: row.user_email,
      avatarUrl: row.user_avatar_url,
    },
    leaveType: {
      code: row.leave_type_code,
      color: row.leave_type_color,
    },
  }));

  return success(absences);
}
