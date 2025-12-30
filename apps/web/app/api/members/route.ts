import { NextRequest } from 'next/server';

import { getCloudflareContext } from '@opennextjs/cloudflare';

import { auth } from '~/lib/auth/auth';
import { success, unauthorized, forbidden } from '~/lib/api/responses';

interface MemberRow {
  id: string;
  role: string;
  status: string;
  joined_at: string | null;
  user_id: string;
  user_name: string | null;
  user_email: string;
  user_avatar_url: string | null;
  team_names: string | null;
}


/**
 * GET /api/members
 * Get all members of the current user's organization
 */
export async function GET(_request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return unauthorized();
  }

  const { env } = getCloudflareContext();
  const db = env.DB;

  // Get user's organization
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

  // Get all members of the organization
  const result = await db
    .prepare(
      `SELECT
        om.id,
        om.role,
        om.status,
        om.joined_at,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        u.image as user_avatar_url,
        GROUP_CONCAT(t.name) as team_names
      FROM organization_members om
      JOIN users u ON om.user_id = u.id
      LEFT JOIN team_members tm ON om.user_id = tm.user_id
      LEFT JOIN teams t ON tm.team_id = t.id AND t.organization_id = om.organization_id
      WHERE om.organization_id = ? AND om.status = 'active'
      GROUP BY om.id, om.role, om.status, om.joined_at, u.id, u.name, u.email, u.image
      ORDER BY om.role, u.name`
    )
    .bind(membership.organization_id)
    .all<MemberRow>();

  const members = result.results.map((row: MemberRow) => ({
    id: row.id,
    role: row.role,
    status: row.status,
    joinedAt: row.joined_at,
    user: {
      id: row.user_id,
      name: row.user_name,
      email: row.user_email,
      avatarUrl: row.user_avatar_url,
    },
    teamNames: row.team_names ? String(row.team_names).split(',') : [],
  }));

  return success(members);
}
