import { NextRequest } from 'next/server';

import { getCloudflareContext } from '@opennextjs/cloudflare';

import { auth } from '~/lib/auth/auth';
import {
  badRequest,
  forbidden,
  notFound,
  success,
  unauthorized,
} from '~/lib/api/responses';

interface RouteParams {
  params: Promise<{ teamId: string }>;
}

/**
 * DELETE /api/teams/[teamId]
 * Delete a team and all its member associations
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return unauthorized();
  }

  const { teamId } = await params;
  const { env } = getCloudflareContext();
  const db = env.DB;

  // Check user is part of an organization and has permission
  const membership = await db
    .prepare(
      `SELECT organization_id, role
       FROM organization_members
       WHERE user_id = ? AND status = 'active'
       LIMIT 1`
    )
    .bind(session.user.id)
    .first<{ organization_id: string; role: string }>();

  if (!membership) {
    return badRequest('You are not a member of any organization');
  }

  if (!['admin', 'manager', 'hr'].includes(membership.role)) {
    return forbidden('Only admins, managers, and HR can delete teams');
  }

  // Verify team exists and belongs to user's organization
  const team = await db
    .prepare(
      `SELECT id, name FROM teams WHERE id = ? AND organization_id = ? LIMIT 1`
    )
    .bind(teamId, membership.organization_id)
    .first<{ id: string; name: string }>();

  if (!team) {
    return notFound('Team');
  }

  // Delete team members first, then the team
  await db.batch([
    db.prepare(`DELETE FROM team_members WHERE team_id = ?`).bind(teamId),
    db.prepare(`DELETE FROM teams WHERE id = ?`).bind(teamId),
  ]);

  return success({ deleted: true, teamId, teamName: team.name });
}
