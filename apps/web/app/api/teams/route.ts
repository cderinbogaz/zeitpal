import { NextRequest } from 'next/server';

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { z } from 'zod';

import { auth } from '~/lib/auth/auth';
import {
  badRequest,
  conflict,
  created,
  forbidden,
  success,
  unauthorized,
  validationError,
} from '~/lib/api/responses';


interface TeamRow {
  id: string;
  name: string;
  description: string | null;
  color: string;
  min_coverage: number;
  member_count: number;
  created_at: string;
  updated_at: string;
}

const createTeamSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters'),
  description: z.string().max(200).optional().nullable(),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}){1,2}$/, 'Invalid color format')
    .optional()
    .nullable(),
  minCoverage: z.coerce.number().int().min(1).optional().nullable(),
  memberIds: z.array(z.string()).optional(),
});

/**
 * GET /api/teams
 * Get teams for the organization
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

  const result = await db
    .prepare(
      `SELECT
        t.id,
        t.name,
        t.description,
        t.color,
        t.min_coverage,
        COUNT(tm.user_id) as member_count,
        t.created_at,
        t.updated_at
      FROM teams t
      LEFT JOIN team_members tm ON tm.team_id = t.id
      WHERE t.organization_id = ?
      GROUP BY t.id, t.name, t.description, t.color, t.min_coverage, t.created_at, t.updated_at
      ORDER BY t.name`
    )
    .bind(membership.organization_id)
    .all<TeamRow>();

  const teams = result.results.map((row: TeamRow) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    color: row.color,
    minCoverage: row.min_coverage,
    memberCount: Number(row.member_count),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return success(teams);
}

/**
 * POST /api/teams
 * Create a new team
 */
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return unauthorized();
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
    return forbidden('Only admins, managers, and HR can create teams');
  }

  const body = await request.json();
  const parsed = createTeamSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error.flatten());
  }

  const { name, description, color, minCoverage, memberIds } = parsed.data;
  const uniqueMemberIds = Array.from(new Set(memberIds ?? []));

  const existing = await db
    .prepare(
      `SELECT id FROM teams
       WHERE organization_id = ? AND LOWER(name) = LOWER(?)
       LIMIT 1`
    )
    .bind(membership.organization_id, name)
    .first<{ id: string }>();

  if (existing) {
    return conflict('A team with this name already exists');
  }

  let validMemberIds: string[] = [];
  if (uniqueMemberIds.length > 0) {
    const placeholders = uniqueMemberIds.map(() => '?').join(',');
    const membersResult = await db
      .prepare(
        `SELECT user_id FROM organization_members
         WHERE organization_id = ? AND status = 'active' AND user_id IN (${placeholders})`
      )
      .bind(membership.organization_id, ...uniqueMemberIds)
      .all<{ user_id: string }>();

    validMemberIds = membersResult.results.map((row: { user_id: string }) => row.user_id);

    if (validMemberIds.length !== uniqueMemberIds.length) {
      return badRequest('One or more members are not part of this organization');
    }
  }

  const teamId = crypto.randomUUID();
  const now = new Date().toISOString();

  const statements = [
    db
      .prepare(
        `INSERT INTO teams (
          id, organization_id, name, description, color, min_coverage, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        teamId,
        membership.organization_id,
        name,
        description || null,
        color || '#6366F1',
        minCoverage ?? 1,
        now,
        now
      ),
  ];

  if (validMemberIds.length > 0) {
    const memberStatements = validMemberIds.map((userId) =>
      db
        .prepare(
          `INSERT OR IGNORE INTO team_members (
            id, team_id, user_id, is_lead, created_at
          ) VALUES (?, ?, ?, 0, ?)`
        )
        .bind(crypto.randomUUID(), teamId, userId, now)
    );
    statements.push(...memberStatements);
  }

  await db.batch(statements);

  return created({
    id: teamId,
    name,
    description: description || null,
    color: color || '#6366F1',
    minCoverage: minCoverage ?? 1,
    memberCount: validMemberIds.length,
    createdAt: now,
    updatedAt: now,
  });
}
