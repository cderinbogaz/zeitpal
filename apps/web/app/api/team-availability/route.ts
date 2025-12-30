import { NextRequest } from 'next/server';

import { getCloudflareContext } from '@opennextjs/cloudflare';

import { auth } from '~/lib/auth/auth';
import { forbidden, success, unauthorized } from '~/lib/api/responses';


interface TeamAvailabilityRow {
  id: string;
  role: string;
  user_id: string;
  user_name: string | null;
  user_email: string;
  user_avatar_url: string | null;
  team_names: string | null;
  current_leave_type: string | null;
  current_leave_end_date: string | null;
  next_leave_type: string | null;
  next_leave_start_date: string | null;
}

/**
 * GET /api/team-availability
 * Get team members with current and upcoming availability.
 */
export async function GET(_: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return unauthorized();
  }

  const { env } = getCloudflareContext();
  const db = env.DB;

  const membership = await db
    .prepare(
      `SELECT organization_id, role FROM organization_members
       WHERE user_id = ? AND status = 'active'
       LIMIT 1`
    )
    .bind(session.user.id)
    .first<{ organization_id: string; role: string }>();

  if (!membership) {
    return forbidden('Not a member of any organization');
  }

  const result = await db
    .prepare(
      `SELECT
        om.id,
        om.role,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        u.image as user_avatar_url,
        GROUP_CONCAT(DISTINCT t.name) as team_names,
        (
          SELECT lt.code
          FROM leave_requests lr
          JOIN leave_types lt ON lr.leave_type_id = lt.id
          WHERE lr.user_id = om.user_id
            AND lr.organization_id = om.organization_id
            AND lr.status = 'approved'
            AND date('now') BETWEEN lr.start_date AND lr.end_date
          ORDER BY lr.start_date DESC
          LIMIT 1
        ) as current_leave_type,
        (
          SELECT lr.end_date
          FROM leave_requests lr
          WHERE lr.user_id = om.user_id
            AND lr.organization_id = om.organization_id
            AND lr.status = 'approved'
            AND date('now') BETWEEN lr.start_date AND lr.end_date
          ORDER BY lr.start_date DESC
          LIMIT 1
        ) as current_leave_end_date,
        (
          SELECT lt.code
          FROM leave_requests lr
          JOIN leave_types lt ON lr.leave_type_id = lt.id
          WHERE lr.user_id = om.user_id
            AND lr.organization_id = om.organization_id
            AND lr.status = 'approved'
            AND lr.start_date > date('now')
          ORDER BY lr.start_date ASC
          LIMIT 1
        ) as next_leave_type,
        (
          SELECT lr.start_date
          FROM leave_requests lr
          WHERE lr.user_id = om.user_id
            AND lr.organization_id = om.organization_id
            AND lr.status = 'approved'
            AND lr.start_date > date('now')
          ORDER BY lr.start_date ASC
          LIMIT 1
        ) as next_leave_start_date
      FROM organization_members om
      JOIN users u ON om.user_id = u.id
      LEFT JOIN team_members tm ON om.user_id = tm.user_id
      LEFT JOIN teams t ON tm.team_id = t.id AND t.organization_id = om.organization_id
      WHERE om.organization_id = ? AND om.status = 'active'
      GROUP BY om.id, om.role, u.id, u.name, u.email, u.image
      ORDER BY u.name`
    )
    .bind(membership.organization_id)
    .all<TeamAvailabilityRow>();

  const members = result.results.map((row: TeamAvailabilityRow) => ({
    id: row.id,
    role: row.role,
    user: {
      id: row.user_id,
      name: row.user_name,
      email: row.user_email,
      avatarUrl: row.user_avatar_url,
    },
    teamNames: row.team_names
      ? String(row.team_names)
          .split(',')
          .map((name) => name.trim())
          .filter(Boolean)
      : [],
    currentAbsence:
      row.current_leave_type && row.current_leave_end_date
        ? {
            type: row.current_leave_type,
            endDate: row.current_leave_end_date,
          }
        : null,
    nextAbsence:
      row.next_leave_type && row.next_leave_start_date
        ? {
            type: row.next_leave_type,
            startDate: row.next_leave_start_date,
          }
        : null,
  }));

  return success(members);
}
