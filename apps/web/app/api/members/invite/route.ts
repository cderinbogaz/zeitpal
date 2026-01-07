import { NextRequest } from 'next/server';

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { z } from 'zod';

import { auth } from '~/lib/auth/auth';
import {
  badRequest,
  created,
  unauthorized,
  forbidden,
  conflict,
  validationError,
} from '~/lib/api/responses';
import { sendMemberInvitationEmail } from '~/lib/emails';
import { getSiteUrl } from '~/lib/services/email.service';


const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'manager', 'member']).default('member'),
  teamIds: z.array(z.string()).optional(),
});

/**
 * POST /api/members/invite
 * Invite a new member to the organization
 */
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return unauthorized();
  }

  const body = await request.json();
  const parsed = inviteSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error.flatten());
  }

  const { email, role, teamIds } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();
  const { env, ctx } = getCloudflareContext();
  const db = env.DB;

  // Get user's organization and verify they have permission to invite
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

  // Only admins and managers can invite
  if (membership.role !== 'admin' && membership.role !== 'manager') {
    return forbidden('Only admins and managers can invite members');
  }

  // Managers can only invite members, not admins or other managers
  if (membership.role === 'manager' && role !== 'member') {
    return forbidden('Managers can only invite regular members');
  }

  // Check if there's already a pending invite for this email
  const existingInvite = await db
    .prepare(
      `SELECT id FROM organization_invites
       WHERE organization_id = ? AND email = ? AND accepted_at IS NULL AND expires_at > datetime('now')`
    )
    .bind(membership.organization_id, normalizedEmail)
    .first();

  if (existingInvite) {
    return conflict('An invite for this email is already pending');
  }

  // Check if user is already a member
  const existingMember = await db
    .prepare(
      `SELECT om.id FROM organization_members om
       JOIN users u ON om.user_id = u.id
       WHERE om.organization_id = ? AND LOWER(u.email) = ? AND om.status = 'active'`
    )
    .bind(membership.organization_id, normalizedEmail)
    .first();

  if (existingMember) {
    return conflict('This user is already a member of the organization');
  }

  let teamId: string | null = null;
  const uniqueTeamIds = Array.from(new Set(teamIds ?? []));

  if (uniqueTeamIds.length > 0) {
    const placeholders = uniqueTeamIds.map(() => '?').join(',');
    const teamResult = await db
      .prepare(
        `SELECT id FROM teams
         WHERE organization_id = ? AND id IN (${placeholders})`
      )
      .bind(membership.organization_id, ...uniqueTeamIds)
      .all<{ id: string }>();

    const validTeamIds = teamResult.results.map((row: { id: string }) => row.id);

    if (validTeamIds.length === 0) {
      return badRequest('Selected team not found');
    }

    teamId = validTeamIds[0] ?? null;
  }

  // Create the invite
  const inviteId = crypto.randomUUID();
  const token = crypto.randomUUID();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  await db
    .prepare(
      `INSERT INTO organization_invites (
        id, organization_id, email, role, token, invited_by, expires_at, created_at, team_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      inviteId,
      membership.organization_id,
      normalizedEmail,
      role,
      token,
      session.user.id,
      expiresAt,
      now,
      teamId
    )
    .run();

  // Get organization name and inviter name for email
  const organization = await db
    .prepare('SELECT name FROM organizations WHERE id = ?')
    .bind(membership.organization_id)
    .first<{ name: string }>();

  const inviter = await db
    .prepare('SELECT name, email FROM users WHERE id = ?')
    .bind(session.user.id)
    .first<{ name: string; email: string }>();

  const siteUrl = getSiteUrl();
  const inviteUrl = `${siteUrl}/invite/${token}`;

  // Send invite email using waitUntil to ensure it's sent before worker terminates
  if (organization?.name && inviter) {
    const emailPromise = sendMemberInvitationEmail(env, {
      inviteeName: email.split('@')[0] ?? email, // Use email prefix as name
      inviteeEmail: normalizedEmail,
      organizationName: organization.name,
      inviterName: inviter.name || inviter.email,
      role,
      inviteUrl,
      expiresAt,
    }).catch((error) => {
      console.error('Failed to send invitation email:', error);
    });

    ctx.waitUntil(emailPromise);
  }

  return created({
    id: inviteId,
    email,
    role,
    expiresAt,
    inviteUrl: `/invite/${token}`,
  });
}
