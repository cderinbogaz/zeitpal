import { NextRequest } from 'next/server';

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { z } from 'zod';

import { auth } from '~/lib/auth/auth';
import {
  badRequest,
  forbidden,
  notFound,
  success,
  unauthorized,
  validationError,
} from '~/lib/api/responses';

const updateInviteSchema = z.object({
  teamId: z.string().nullable(),
});

interface RouteParams {
  params: Promise<{ inviteId: string }>;
}

/**
 * PATCH /api/members/invites/[inviteId]
 * Update team assignment for a pending invite
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return unauthorized();
  }

  const { inviteId } = await params;
  const body = await request.json();
  const parsed = updateInviteSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error.flatten());
  }

  const { env } = getCloudflareContext();
  const db = env.DB;

  // Get user's organization and verify they have permission
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

  // Only admins, managers, and HR can update invites
  if (!['admin', 'manager', 'hr'].includes(membership.role)) {
    return forbidden('Only admins, managers, and HR can update invites');
  }

  // Check if invite exists and belongs to user's organization
  const invite = await db
    .prepare(
      `SELECT id, email FROM organization_invites
       WHERE id = ? AND organization_id = ? AND accepted_at IS NULL AND expires_at > datetime('now')
       LIMIT 1`
    )
    .bind(inviteId, membership.organization_id)
    .first<{ id: string; email: string }>();

  if (!invite) {
    return notFound('Invite not found or already accepted');
  }

  const { teamId } = parsed.data;

  // If teamId is provided, verify it exists and belongs to the organization
  if (teamId) {
    const team = await db
      .prepare(
        `SELECT id FROM teams WHERE id = ? AND organization_id = ? LIMIT 1`
      )
      .bind(teamId, membership.organization_id)
      .first<{ id: string }>();

    if (!team) {
      return badRequest('Team not found');
    }
  }

  // Update the invite's team assignment
  await db
    .prepare(
      `UPDATE organization_invites
       SET team_id = ?
       WHERE id = ?`
    )
    .bind(teamId, inviteId)
    .run();

  return success({
    id: inviteId,
    email: invite.email,
    teamId,
  });
}
