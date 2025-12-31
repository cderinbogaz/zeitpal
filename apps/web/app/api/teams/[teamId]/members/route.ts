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

interface TeamMemberRow {
  user_id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  is_lead: number;
}

const addMembersSchema = z.object({
  memberIds: z.array(z.string().min(1)).min(1, 'Select at least one member'),
});

interface RouteParams {
  params: Promise<{ teamId: string }>;
}

/**
 * GET /api/teams/[teamId]/members
 * Get members of a specific team
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return unauthorized();
  }

  const { teamId } = await params;
  const { env } = getCloudflareContext();
  const db = env.DB;

  // Check user is part of an organization
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

  // Get team members with user details
  const result = await db
    .prepare(
      `SELECT
        u.id as user_id,
        u.name,
        u.email,
        u.image,
        om.role,
        tm.is_lead
      FROM team_members tm
      INNER JOIN users u ON u.id = tm.user_id
      INNER JOIN organization_members om ON om.user_id = tm.user_id AND om.organization_id = ?
      WHERE tm.team_id = ?
      ORDER BY u.name, u.email`
    )
    .bind(membership.organization_id, teamId)
    .all<TeamMemberRow>();

  const members = result.results.map((row: TeamMemberRow) => ({
    id: row.user_id,
    role: row.role,
    status: 'active',
    isLead: row.is_lead === 1,
    user: {
      id: row.user_id,
      name: row.name,
      email: row.email,
      avatarUrl: row.image,
    },
  }));

  return success(members);
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
