import { NextRequest } from 'next/server';

import { getCloudflareContext } from '@opennextjs/cloudflare';

import { auth } from '~/lib/auth/auth';
import { forbidden, success, unauthorized } from '~/lib/api/responses';

interface InviteRow {
  id: string;
  email: string;
  role: string;
  expires_at: string;
  created_at: string;
  team_id: string | null;
  team_name: string | null;
}

/**
 * GET /api/members/invites
 * Get pending invites for the current user's organization.
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

  if (!['admin', 'manager', 'hr'].includes(membership.role)) {
    return forbidden('Not authorized to view invites');
  }

  const result = await db
    .prepare(
      `SELECT
        i.id,
        i.email,
        i.role,
        i.expires_at,
        i.created_at,
        i.team_id,
        t.name as team_name
      FROM organization_invites i
      LEFT JOIN teams t ON t.id = i.team_id
      WHERE i.organization_id = ?
        AND i.accepted_at IS NULL
        AND i.expires_at > datetime('now')
      ORDER BY i.created_at DESC`
    )
    .bind(membership.organization_id)
    .all<InviteRow>();

  const invites = (result.results ?? []).map((row: InviteRow) => ({
    id: row.id,
    email: row.email,
    role: row.role,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    team: row.team_id
      ? { id: row.team_id, name: row.team_name ?? '' }
      : null,
  }));

  return success(invites);
}
