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


const addMembersSchema = z.object({
  memberIds: z.array(z.string().min(1)).min(1, 'Select at least one member'),
});

interface RouteParams {
  params: Promise<{ teamId: string }>;
}

/**
 * POST /api/teams/[teamId]/members
 * Add members to a team
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return unauthorized();
  }

  const { teamId } = await params;
  const body = await request.json();
  const parsed = addMembersSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error.flatten());
  }

  const { env } = getCloudflareContext();
  const db = env.DB;

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
    return forbidden('Only admins, managers, and HR can manage team members');
  }

  const team = await db
    .prepare(
      `SELECT id FROM teams WHERE id = ? AND organization_id = ? LIMIT 1`
    )
    .bind(teamId, membership.organization_id)
    .first<{ id: string }>();

  if (!team) {
    return notFound('Team');
  }

  const uniqueMemberIds = Array.from(new Set(parsed.data.memberIds));
  if (uniqueMemberIds.length === 0) {
    return badRequest('No members selected');
  }

  const placeholders = uniqueMemberIds.map(() => '?').join(',');
  const membersResult = await db
    .prepare(
      `SELECT user_id FROM organization_members
       WHERE organization_id = ? AND status = 'active' AND user_id IN (${placeholders})`
    )
    .bind(membership.organization_id, ...uniqueMemberIds)
    .all<{ user_id: string }>();

  const validMemberIds = membersResult.results.map((row: { user_id: string }) => row.user_id);

  if (validMemberIds.length === 0) {
    return badRequest('No valid members to add');
  }

  const now = new Date().toISOString();
  const statements = validMemberIds.map((userId: string) =>
    db
      .prepare(
        `INSERT OR IGNORE INTO team_members (
          id, team_id, user_id, is_lead, created_at
        ) VALUES (?, ?, ?, 0, ?)`
      )
      .bind(crypto.randomUUID(), teamId, userId, now)
  );

  await db.batch(statements);

  return success({
    requestedCount: uniqueMemberIds.length,
    addedCount: validMemberIds.length,
  });
}
