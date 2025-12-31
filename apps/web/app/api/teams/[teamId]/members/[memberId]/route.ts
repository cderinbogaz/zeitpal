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
  params: Promise<{ teamId: string; memberId: string }>;
}

/**
 * DELETE /api/teams/[teamId]/members/[memberId]
 * Remove a member from a team
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return unauthorized();
  }

  const { teamId, memberId } = await params;
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
    return forbidden('Only admins, managers, and HR can remove team members');
  }

  // Verify team exists and belongs to user's organization
  const team = await db
    .prepare(
      `SELECT id FROM teams WHERE id = ? AND organization_id = ? LIMIT 1`
    )
    .bind(teamId, membership.organization_id)
    .first<{ id: string }>();

  if (!team) {
    return notFound('Team');
  }

  // Check if the member is actually in the team
  const teamMember = await db
    .prepare(
      `SELECT id FROM team_members WHERE team_id = ? AND user_id = ? LIMIT 1`
    )
    .bind(teamId, memberId)
    .first<{ id: string }>();

  if (!teamMember) {
    return notFound('Team member');
  }

  // Remove the member from the team
  await db
    .prepare(`DELETE FROM team_members WHERE team_id = ? AND user_id = ?`)
    .bind(teamId, memberId)
    .run();

  return success({ removed: true, teamId, memberId });
}
