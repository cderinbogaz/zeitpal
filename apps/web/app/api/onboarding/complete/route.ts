import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '~/lib/auth/auth';
import { badRequest, created, unauthorized } from '~/lib/api/responses';
import { sendMemberInvitationEmail } from '~/lib/emails';
import { getSiteUrl } from '~/lib/services/email.service';

type TableInfoRow = { name: string };

const onboardingCompleteSchema = z.object({
  // Profile
  displayName: z.string().min(1).optional(),
  timezone: z.string().optional(),
  locale: z.enum(['en', 'de']).optional(),

  // Organization
  organizationName: z.string().min(2),
  organizationSlug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/),
  country: z.string().min(2),
  region: z.string().optional().nullable(),

  // Policy
  defaultVacationDays: z.coerce.number().min(1).max(60).default(30),
  carryoverEnabled: z.boolean().default(true),
  carryoverMaxDays: z.coerce.number().min(0).max(30).default(5),

  // Team (optional)
  teamName: z.string().min(2).optional().nullable(),
  teamColor: z.string().optional().nullable(),

  // Invites (optional)
  invites: z
    .array(
      z.object({
        email: z.string().email(),
        role: z.enum(['admin', 'manager', 'hr', 'employee']),
      })
    )
    .optional()
    .default([]),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    const body = await request.json();
    const parsed = onboardingCompleteSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest('Invalid input', parsed.error.flatten());
    }

    const data = parsed.data;
    const userId = session.user.id;
    const userEmail = session.user.email?.trim();
    const { env, ctx } = getCloudflareContext();
    const db = env.DB;
    const userTableInfo = await db.prepare('PRAGMA table_info(users)').all<TableInfoRow>();
    const accountTableInfo = await db.prepare('PRAGMA table_info(accounts)').all<TableInfoRow>();
    const sessionTableInfo = await db.prepare('PRAGMA table_info(sessions)').all<TableInfoRow>();
    const userColumns = new Set(
      (userTableInfo.results ?? []).map((column: TableInfoRow) => column.name)
    );
    const accountColumns = new Set(
      (accountTableInfo.results ?? []).map((column: TableInfoRow) => column.name)
    );
    const sessionColumns = new Set(
      (sessionTableInfo.results ?? []).map((column: TableInfoRow) => column.name)
    );
    const emailVerifiedColumn = userColumns.has('emailVerified')
      ? 'emailVerified'
      : userColumns.has('email_verified')
        ? 'email_verified'
        : null;
    const accountsUserIdColumn = accountColumns.has('userId')
      ? 'userId'
      : accountColumns.has('user_id')
        ? 'user_id'
        : null;
    const sessionsUserIdColumn = sessionColumns.has('userId')
      ? 'userId'
      : sessionColumns.has('user_id')
        ? 'user_id'
        : null;
    const existingUser = userEmail
      ? await db
          .prepare('SELECT id FROM users WHERE lower(email) = lower(?)')
          .bind(userEmail)
          .first<{ id: string }>()
      : null;

    // Generate unique IDs
    const orgId = crypto.randomUUID();
    const memberId = crypto.randomUUID();
    const now = new Date().toISOString();
    const displayName = data.displayName || session.user.name || null;
    const timezone = data.timezone || 'Europe/Berlin';
    const locale = data.locale || 'en';
    const onboardingSteps = JSON.stringify([
      'welcome',
      'profile',
      'organization',
      'location',
      'policy',
      'team',
      'invite',
      'complete',
    ]);

    // Start a batch transaction
    const statements = [];
    const existingUserId = existingUser?.id as string | undefined;
    const shouldMergeUser = !!existingUserId && existingUserId !== userId;

    // 1. Ensure user exists (UPSERT) and update profile
    // This handles the case where the D1 adapter wasn't used during auth
    if (shouldMergeUser && userEmail) {
      const tempEmail = `merged+${existingUserId}@local.invalid`;

      statements.push(
        db
          .prepare('UPDATE users SET email = ?, updated_at = ? WHERE id = ?')
          .bind(tempEmail, now, existingUserId)
      );

      const insertColumns = [
        'id',
        'email',
        'name',
      ];
      const selectColumns = [
        '?',
        '?',
        'COALESCE(?, name)',
      ];
      const insertValues: Array<string | number | null> = [
        userId,
        userEmail,
        displayName,
      ];

      if (emailVerifiedColumn) {
        insertColumns.push(emailVerifiedColumn);
        selectColumns.push(emailVerifiedColumn);
      }

      insertColumns.push(
        'image',
        'phone',
        'locale',
        'timezone',
        'employee_id',
        'start_date',
        'end_date',
        'weekly_hours',
        'work_days_per_week',
        'notification_preferences',
        'onboarding_completed_at',
        'onboarding_steps_completed',
        'created_at',
        'updated_at'
      );
      selectColumns.push(
        'image',
        'phone',
        'COALESCE(?, locale)',
        'COALESCE(?, timezone)',
        'employee_id',
        'start_date',
        'end_date',
        'weekly_hours',
        'work_days_per_week',
        'notification_preferences',
        '?',
        '?',
        'created_at',
        '?'
      );
      insertValues.push(
        locale,
        timezone,
        now,
        onboardingSteps,
        now
      );

      statements.push(
        db
          .prepare(
            `INSERT INTO users (${insertColumns.join(', ')})
             SELECT ${selectColumns.join(', ')}
             FROM users WHERE id = ?`
          )
          .bind(...insertValues, existingUserId)
      );

      const userIdUpdates = [
        { table: 'accounts', column: accountsUserIdColumn },
        { table: 'sessions', column: sessionsUserIdColumn },
        { table: 'organization_members', column: 'user_id' },
        { table: 'team_members', column: 'user_id' },
        { table: 'leave_balances', column: 'user_id' },
        { table: 'leave_requests', column: 'user_id' },
        { table: 'leave_requests', column: 'cancelled_by' },
        { table: 'approval_rules', column: 'approver_user_id' },
        { table: 'leave_approvals', column: 'approver_id' },
        { table: 'organization_invites', column: 'invited_by' },
        { table: 'audit_logs', column: 'user_id' },
        { table: 'notifications', column: 'user_id' },
      ].filter((entry) => entry.column);

      for (const { table, column } of userIdUpdates) {
        statements.push(
          db
            .prepare(`UPDATE ${table} SET ${column} = ? WHERE ${column} = ?`)
            .bind(userId, existingUserId)
        );
      }

      statements.push(
        db
          .prepare('DELETE FROM users WHERE id = ?')
          .bind(existingUserId)
      );
    } else {
      statements.push(
        db
          .prepare(
            `INSERT INTO users (id, email, name, timezone, locale, onboarding_completed_at, onboarding_steps_completed, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               name = COALESCE(excluded.name, users.name),
               timezone = COALESCE(excluded.timezone, users.timezone),
               locale = COALESCE(excluded.locale, users.locale),
               onboarding_completed_at = excluded.onboarding_completed_at,
               onboarding_steps_completed = excluded.onboarding_steps_completed,
               updated_at = excluded.updated_at`
          )
          .bind(
            userId,
            userEmail,
            displayName,
            timezone,
            locale,
            now,
            onboardingSteps,
            now,
            now
          )
      );
    }

    // 2. Create organization
    statements.push(
      db
        .prepare(
          `INSERT INTO organizations (
             id, name, slug, country, region, bundesland,
             default_vacation_days, carryover_enabled, carryover_max_days,
             created_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          orgId,
          data.organizationName,
          data.organizationSlug,
          data.country,
          data.region || null,
          data.country === 'DE' ? (data.region || '') : '', // bundesland for DE, empty for others
          data.defaultVacationDays,
          data.carryoverEnabled ? 1 : 0,
          data.carryoverMaxDays,
          now,
          now
        )
    );

    // 3. Add user as admin member of the organization
    statements.push(
      db
        .prepare(
          `INSERT INTO organization_members (
             id, organization_id, user_id, role, status, joined_at, created_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(memberId, orgId, userId, 'admin', 'active', now, now, now)
    );

    // 4. Create initial leave balances for the user
    const currentYear = new Date().getFullYear();

    // Get all active leave types
    const leaveTypes = await db
      .prepare(
        `SELECT id, code, default_days_per_year, has_allowance
         FROM leave_types
         WHERE organization_id IS NULL AND is_active = 1`
      )
      .all();

    for (const leaveType of leaveTypes.results || []) {
      const balanceId = crypto.randomUUID();
      const entitled =
        leaveType.code === 'vacation'
          ? data.defaultVacationDays
          : (leaveType.default_days_per_year as number | null) || 0;

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
            orgId,
            userId,
            leaveType.id as string,
            currentYear,
            entitled,
            now,
            now
          )
      );
    }

    // 5. Create team if provided
    let teamId: string | null = null;
    if (data.teamName) {
      teamId = crypto.randomUUID();
      const teamMemberId = crypto.randomUUID();

      statements.push(
        db
          .prepare(
            `INSERT INTO teams (id, organization_id, name, color, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?)`
          )
          .bind(
            teamId,
            orgId,
            data.teamName,
            data.teamColor || '#3B82F6',
            now,
            now
          )
      );

      // Add current user as team lead
      statements.push(
        db
          .prepare(
            `INSERT INTO team_members (id, team_id, user_id, is_lead, created_at)
             VALUES (?, ?, ?, 1, ?)`
          )
          .bind(teamMemberId, teamId, userId, now)
      );
    }

    // 6. Create invites if provided
    const inviteDetails: Array<{
      email: string;
      role: string;
      token: string;
      expiresAt: string;
    }> = [];

    for (const invite of data.invites) {
      const inviteId = crypto.randomUUID();
      const token = crypto.randomUUID();
      const expiresAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString(); // 7 days

      statements.push(
        db
          .prepare(
            `INSERT INTO organization_invites (
               id, organization_id, email, role, token, invited_by,
               team_id, expires_at, created_at
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            inviteId,
            orgId,
            invite.email.toLowerCase(),
            invite.role,
            token,
            userId,
            teamId,
            expiresAt,
            now
          )
      );

      // Store invite details for sending emails after batch succeeds
      inviteDetails.push({
        email: invite.email.toLowerCase(),
        role: invite.role,
        token,
        expiresAt,
      });
    }

    // 7. Create audit log entry
    const auditId = crypto.randomUUID();
    statements.push(
      db
        .prepare(
          `INSERT INTO audit_logs (
             id, organization_id, user_id, action, entity_type, entity_id,
             new_values, created_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          auditId,
          orgId,
          userId,
          'organization.created',
          'organization',
          orgId,
          JSON.stringify({
            name: data.organizationName,
            country: data.country,
            region: data.region,
          }),
          now
        )
    );

    // Execute all statements in batch
    await db.batch(statements);

    // Send invite emails after successful database transaction
    // Use waitUntil to ensure emails are sent before worker terminates
    const siteUrl = getSiteUrl();
    const inviterName = data.displayName || session.user.name || session.user.email || 'Team Admin';

    if (inviteDetails.length > 0) {
      const emailPromises = inviteDetails.map((invite) => {
        const inviteUrl = `${siteUrl}/invite/${invite.token}`;

        return sendMemberInvitationEmail(env, {
          inviteeName: invite.email.split('@')[0] ?? invite.email,
          inviteeEmail: invite.email,
          organizationName: data.organizationName,
          inviterName,
          role: invite.role,
          inviteUrl,
          expiresAt: invite.expiresAt,
        }).catch((error) => {
          console.error(`Failed to send invitation email to ${invite.email}:`, error);
        });
      });

      // Use waitUntil to keep the worker alive until emails are sent
      ctx.waitUntil(Promise.all(emailPromises));
    }

    return created({
      success: true,
      organizationId: orgId,
      organizationSlug: data.organizationSlug,
      teamId,
      invitesSent: inviteDetails.length,
    });
  } catch (error) {
    console.error('Onboarding completion error:', error);

    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      const match = error.message.match(/UNIQUE constraint failed: ([^\s]+)/);
      const constraint = match?.[1];

      if (constraint?.includes('organizations.slug')) {
        return badRequest(
          'An organization with this URL already exists. Please choose a different one.'
        );
      }

      if (constraint?.includes('users.email')) {
        return badRequest(
          'A user with this email already exists. Please sign out and sign back in.'
        );
      }

      if (constraint?.includes('organization_members.organization_id') && constraint.includes('organization_members.user_id')) {
        return badRequest('You are already a member of an organization.');
      }

      if (constraint?.includes('organization_invites.organization_id') && constraint.includes('organization_invites.email')) {
        return badRequest('An invite for this email already exists.');
      }

      return badRequest('A unique constraint failed. Please try again.');
    }

    return NextResponse.json(
      {
        error: 'Failed to complete onboarding',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
