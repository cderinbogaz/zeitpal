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
  current_leave_request_id: string | null;
  current_leave_type: string | null;
  current_leave_end_date: string | null;
  next_leave_request_id: string | null;
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
      `WITH current_leave AS (
        SELECT
          lr.user_id,
          lr.id AS current_leave_request_id,
          lt.code AS current_leave_type,
          lr.end_date AS current_leave_end_date
        FROM (
          SELECT
            lr.*,
            ROW_NUMBER() OVER (
              PARTITION BY lr.user_id
              ORDER BY lr.start_date DESC
            ) AS rn
          FROM leave_requests lr
          WHERE lr.organization_id = ?
            AND lr.status = 'approved'
            AND date('now') BETWEEN lr.start_date AND lr.end_date
        ) lr
        JOIN leave_types lt ON lr.leave_type_id = lt.id
        WHERE lr.rn = 1
      ),
      next_leave AS (
        SELECT
          lr.user_id,
          lr.id AS next_leave_request_id,
          lt.code AS next_leave_type,
          lr.start_date AS next_leave_start_date
        FROM (
          SELECT
            lr.*,
            ROW_NUMBER() OVER (
              PARTITION BY lr.user_id
              ORDER BY lr.start_date ASC
            ) AS rn
          FROM leave_requests lr
          WHERE lr.organization_id = ?
            AND lr.status = 'approved'
            AND lr.start_date > date('now')
        ) lr
        JOIN leave_types lt ON lr.leave_type_id = lt.id
        WHERE lr.rn = 1
      )
      SELECT
        om.id,
        om.role,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        u.image as user_avatar_url,
        GROUP_CONCAT(DISTINCT t.name) as team_names,
        current_leave.current_leave_request_id,
        current_leave.current_leave_type,
        current_leave.current_leave_end_date,
        next_leave.next_leave_request_id,
        next_leave.next_leave_type,
        next_leave.next_leave_start_date
      FROM organization_members om
      JOIN users u ON om.user_id = u.id
      LEFT JOIN team_members tm ON om.user_id = tm.user_id
      LEFT JOIN teams t ON tm.team_id = t.id AND t.organization_id = om.organization_id
      LEFT JOIN current_leave ON current_leave.user_id = om.user_id
      LEFT JOIN next_leave ON next_leave.user_id = om.user_id
      WHERE om.organization_id = ? AND om.status = 'active'
      GROUP BY
        om.id,
        om.role,
        u.id,
        u.name,
        u.email,
        u.image,
        current_leave.current_leave_request_id,
        current_leave.current_leave_type,
        current_leave.current_leave_end_date,
        next_leave.next_leave_request_id,
        next_leave.next_leave_type,
        next_leave.next_leave_start_date
      ORDER BY u.name`
    )
    .bind(
      membership.organization_id,
      membership.organization_id,
      membership.organization_id,
    )
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
      row.current_leave_request_id &&
      row.current_leave_type &&
      row.current_leave_end_date
        ? {
            id: row.current_leave_request_id,
            type: row.current_leave_type,
            endDate: row.current_leave_end_date,
          }
        : null,
    nextAbsence:
      row.next_leave_request_id &&
      row.next_leave_type &&
      row.next_leave_start_date
        ? {
            id: row.next_leave_request_id,
            type: row.next_leave_type,
            startDate: row.next_leave_start_date,
          }
        : null,
  }));

  return success(members);
}
