import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextRequest } from 'next/server';

import { auth } from '~/lib/auth/auth';
import {
  badRequest,
  notFound,
  success,
  unauthorized,
} from '~/lib/api/responses';

interface InviteRow {
  id: string;
  organization_id: string;
  email: string;
  role: string;
  token: string;
  invited_by: string;
  team_id: string | null;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  organization_name: string;
  inviter_name: string | null;
  inviter_email: string;
}

/**
 * GET /api/invite/[token]
 * Get invite details by token (public endpoint)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const { env } = getCloudflareContext();
  const db = env.DB;

  // Get invite with organization and inviter details
  const invite = await db
    .prepare(
      `SELECT
        i.id, i.organization_id, i.email, i.role, i.token, i.team_id,
        i.invited_by, i.expires_at, i.accepted_at, i.created_at,
        o.name as organization_name,
        u.name as inviter_name, u.email as inviter_email
       FROM organization_invites i
       JOIN organizations o ON i.organization_id = o.id
       JOIN users u ON i.invited_by = u.id
       WHERE i.token = ?`
    )
    .bind(token)
    .first<InviteRow>();

  if (!invite) {
    return notFound('Invite not found');
  }

  // Check if already accepted
  if (invite.accepted_at) {
    return badRequest('This invite has already been accepted');
  }

  // Check if expired
  if (new Date(invite.expires_at) < new Date()) {
    return badRequest('This invite has expired');
  }

  return success({
    id: invite.id,
    email: invite.email,
    role: invite.role,
    organizationName: invite.organization_name,
    inviterName: invite.inviter_name || invite.inviter_email,
    expiresAt: invite.expires_at,
  });
}

/**
 * POST /api/invite/[token]
 * Accept an invite (requires authentication)
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return unauthorized('You must be signed in to accept an invite');
  }

  const { token } = await params;
  const { env } = getCloudflareContext();
  const db = env.DB;

  // Get invite details
  const invite = await db
    .prepare(
      `SELECT
        i.id, i.organization_id, i.email, i.role, i.token, i.team_id,
        i.expires_at, i.accepted_at,
        o.name as organization_name
       FROM organization_invites i
       JOIN organizations o ON i.organization_id = o.id
       WHERE i.token = ?`
    )
    .bind(token)
    .first<{
      id: string;
      organization_id: string;
      email: string;
      role: string;
      token: string;
      expires_at: string;
      accepted_at: string | null;
      team_id: string | null;
      organization_name: string;
    }>();

  if (!invite) {
    return notFound('Invite not found');
  }

  // Check if already accepted
  if (invite.accepted_at) {
    return badRequest('This invite has already been accepted');
  }

  // Check if expired
  if (new Date(invite.expires_at) < new Date()) {
    return badRequest('This invite has expired');
  }

  // Verify email matches (case-insensitive)
  if (invite.email.toLowerCase() !== session.user.email?.toLowerCase()) {
    return badRequest(
      `This invite was sent to ${invite.email}. Please sign in with that email address.`
    );
  }

  // Check if user is already a member of this organization
  const existingMembership = await db
    .prepare(
      `SELECT id FROM organization_members
       WHERE organization_id = ? AND user_id = ?`
    )
    .bind(invite.organization_id, session.user.id)
    .first();

  if (existingMembership) {
    // Mark invite as accepted anyway
    await db
      .prepare(
        `UPDATE organization_invites SET accepted_at = ? WHERE id = ?`
      )
      .bind(new Date().toISOString(), invite.id)
      .run();

    return badRequest('You are already a member of this organization');
  }

  const now = new Date().toISOString();
  const memberId = crypto.randomUUID();

  // Start a batch transaction
  const statements = [];

  // 1. Create organization membership
  statements.push(
    db
      .prepare(
        `INSERT INTO organization_members (
          id, organization_id, user_id, role, status, joined_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'active', ?, ?, ?)`
      )
      .bind(
        memberId,
        invite.organization_id,
        session.user.id,
        invite.role,
        now,
        now,
        now
      )
  );

  // 2. Mark invite as accepted
  statements.push(
    db
      .prepare(
        `UPDATE organization_invites SET accepted_at = ? WHERE id = ?`
      )
      .bind(now, invite.id)
  );

  // 3. Add user to team if invite specifies one
  if (invite.team_id) {
    statements.push(
      db
        .prepare(
          `INSERT OR IGNORE INTO team_members (
            id, team_id, user_id, is_lead, created_at
          ) VALUES (?, ?, ?, 0, ?)`
        )
        .bind(crypto.randomUUID(), invite.team_id, session.user.id, now)
    );
  }

  // 4. Create initial leave balances for the user
  const currentYear = new Date().getFullYear();

  // Get organization's default vacation days
  const org = await db
    .prepare('SELECT default_vacation_days FROM organizations WHERE id = ?')
    .bind(invite.organization_id)
    .first<{ default_vacation_days: number }>();

  // Get all active leave types
  const leaveTypes = await db
    .prepare(
      `SELECT id, code, default_days_per_year
       FROM leave_types
       WHERE organization_id IS NULL AND is_active = 1`
    )
    .all<{ id: string; code: string; default_days_per_year: number | null }>();

  for (const leaveType of leaveTypes.results || []) {
    const balanceId = crypto.randomUUID();
    const entitled =
      leaveType.code === 'vacation'
        ? (org?.default_vacation_days ?? 30)
        : (leaveType.default_days_per_year ?? 0);

    statements.push(
      db
        .prepare(
          `INSERT INTO leave_balances (
            id, organization_id, user_id, leave_type_id, year,
            entitled, carried_over, adjustment, used, pending,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, 0, ?, ?)`
        )
        .bind(
          balanceId,
          invite.organization_id,
          session.user.id,
          leaveType.id,
          currentYear,
          entitled,
          now,
          now
        )
    );
  }

  // Execute all statements in batch
  await db.batch(statements);

  return success({
    success: true,
    organizationId: invite.organization_id,
    organizationName: invite.organization_name,
    role: invite.role,
  });
}
