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


// Validation schema for creating an organization
const createOrganizationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  country: z.string().min(2).max(5).default('DE'),
  region: z.string().min(1).max(10).nullable().optional(),
  defaultVacationDays: z.coerce.number().min(20).max(50).default(30),
});

// Validation schema for updating an organization
const updateOrganizationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  country: z.string().min(2).max(5).optional(),
  region: z.string().min(1).max(10).nullable().optional(),
  defaultVacationDays: z.coerce.number().min(20).max(50).optional(),
  carryoverEnabled: z.boolean().optional(),
  carryoverMaxDays: z.coerce.number().min(0).max(30).optional(),
  carryoverExpiryDate: z.string().regex(/^\d{2}-\d{2}$/).optional(),
  sickLeaveAuThreshold: z.coerce.number().min(1).max(7).optional(),
  requireApproval: z.boolean().optional(),
  autoApproveThreshold: z.coerce.number().min(0).max(10).nullable().optional(),
});

/**
 * GET /api/organizations
 * Get the current user's organization
 */
export async function GET(_request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return unauthorized();
  }

  const { env } = getCloudflareContext();
  const db = env.DB;

  // Get user's organization membership
  const result = await db
    .prepare(
      `SELECT
        o.*,
        om.role as member_role
      FROM organization_members om
      JOIN organizations o ON om.organization_id = o.id
      WHERE om.user_id = ? AND om.status = 'active'
      LIMIT 1`
    )
    .bind(session.user.id)
    .first<Record<string, unknown>>();

  if (!result) {
    return success(null);
  }

  const organization = {
    id: result.id,
    name: result.name,
    slug: result.slug,
    country: result.country,
    region: result.region ?? result.bundesland ?? null,
    logoUrl: result.logo_url,
    primaryColor: result.primary_color,
    defaultVacationDays: result.default_vacation_days,
    carryoverEnabled: Boolean(result.carryover_enabled),
    carryoverMaxDays: result.carryover_max_days,
    carryoverExpiryDate: result.carryover_expiry_date,
    sickLeaveAuThreshold: result.sick_leave_au_threshold,
    requireApproval: Boolean(result.require_approval),
    autoApproveThreshold: result.auto_approve_threshold,
    memberRole: result.member_role,
  };

  return success(organization);
}

/**
 * POST /api/organizations
 * Create a new organization
 */
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return unauthorized();
  }

  const body = await request.json();
  const parsed = createOrganizationSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error.flatten());
  }

  const { name, slug, defaultVacationDays, country, region: regionInput } = parsed.data;

  const { env } = getCloudflareContext();
  const db = env.DB;

  // Check if user already has an organization
  const existingMember = await db
    .prepare(
      `SELECT id FROM organization_members
       WHERE user_id = ? AND status = 'active' LIMIT 1`
    )
    .bind(session.user.id)
    .first();

  if (existingMember) {
    return badRequest('You are already a member of an organization');
  }

  // Check if slug is unique
  const existingOrg = await db
    .prepare('SELECT id FROM organizations WHERE slug = ?')
    .bind(slug)
    .first();

  if (existingOrg) {
    return conflict('An organization with this URL slug already exists');
  }

  const userId = session.user.id;
  const orgId = crypto.randomUUID();
  const memberId = crypto.randomUUID();
  const now = new Date().toISOString();
  const region = regionInput ?? (country === 'DE' ? 'BY' : null);
  const bundeslandValue = country === 'DE' ? (region ?? 'BY') : '';

  // Create organization and add user as admin in a batch
  await db.batch([
    db
      .prepare(
        `INSERT INTO organizations (
          id, name, slug, country, region, bundesland, default_vacation_days,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        orgId,
        name,
        slug,
        country,
        region,
        bundeslandValue,
        defaultVacationDays,
        now,
        now
      ),

    db
      .prepare(
        `INSERT INTO organization_members (
          id, organization_id, user_id, role, status, joined_at,
          created_at, updated_at
        ) VALUES (?, ?, ?, 'admin', 'active', ?, ?, ?)`
      )
      .bind(memberId, orgId, userId, now, now, now),
  ]);

  // Copy default leave types for the organization
  const defaultLeaveTypes = await db
    .prepare('SELECT * FROM leave_types WHERE organization_id IS NULL')
    .all();

  // Create leave balances for the user
  const year = new Date().getFullYear();
  const balanceInserts = defaultLeaveTypes.results
    .filter((lt: Record<string, unknown>) => lt.has_allowance)
    .map((lt: Record<string, unknown>) => {
      const balanceId = crypto.randomUUID();
      return db
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
          lt.id,
          year,
          lt.code === 'vacation' ? defaultVacationDays : (lt.default_days_per_year || 0),
          now,
          now
        );
    });

  if (balanceInserts.length > 0) {
    await db.batch(balanceInserts);
  }

  return created({
    id: orgId,
    name,
    slug,
    country,
    region,
  });
}

/**
 * PATCH /api/organizations
 * Update the current user's organization settings
 * Requires admin, manager, or hr role
 */
export async function PATCH(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return unauthorized();
  }

  const { env } = getCloudflareContext();
  const db = env.DB;

  // Get user's organization membership and verify role
  const membership = await db
    .prepare(
      `SELECT om.organization_id, om.role
       FROM organization_members om
       WHERE om.user_id = ? AND om.status = 'active'
       LIMIT 1`
    )
    .bind(session.user.id)
    .first<{ organization_id: string; role: string }>();

  if (!membership) {
    return badRequest('You are not a member of any organization');
  }

  // Check if user has permission to update organization
  if (!['admin', 'manager', 'hr'].includes(membership.role)) {
    return forbidden('Only admins, managers, and HR can update organization settings');
  }

  const body = await request.json();
  const parsed = updateOrganizationSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error.flatten());
  }

  const updates = parsed.data;
  const now = new Date().toISOString();
  const hasLocationUpdates =
    updates.country !== undefined ||
    updates.region !== undefined;

  let currentCountry: string | null = null;
  let currentRegion: string | null = null;

  if (hasLocationUpdates) {
    const current = await db
      .prepare('SELECT country, region FROM organizations WHERE id = ?')
      .bind(membership.organization_id)
      .first<{ country: string; region: string | null }>();

    currentCountry = current?.country ?? 'DE';
    currentRegion = current?.region ?? null;
  }

  let nextCountry = currentCountry ?? 'DE';
  let nextRegion = currentRegion;

  if (updates.country !== undefined) {
    nextCountry = updates.country;
  }

  let regionInput: string | null | undefined;
  if (updates.region !== undefined) {
    regionInput = updates.region;
  }

  let shouldUpdateRegion = false;
  if (regionInput !== undefined) {
    nextRegion = regionInput;
    shouldUpdateRegion = true;
  } else if (updates.country !== undefined) {
    nextRegion = null;
    shouldUpdateRegion = true;
  }

  // Build dynamic update query
  const setClauses: string[] = [];
  const params: (string | number | null)[] = [];

  if (updates.name !== undefined) {
    setClauses.push('name = ?');
    params.push(updates.name);
  }
  if (updates.country !== undefined) {
    setClauses.push('country = ?');
    params.push(nextCountry);
  }
  if (shouldUpdateRegion) {
    setClauses.push('region = ?');
    params.push(nextRegion);
  }
  if (hasLocationUpdates) {
    const nextBundesland = nextCountry === 'DE' ? (nextRegion ?? '') : '';
    setClauses.push('bundesland = ?');
    params.push(nextBundesland);
  }
  if (updates.defaultVacationDays !== undefined) {
    setClauses.push('default_vacation_days = ?');
    params.push(updates.defaultVacationDays);
  }
  if (updates.carryoverEnabled !== undefined) {
    setClauses.push('carryover_enabled = ?');
    params.push(updates.carryoverEnabled ? 1 : 0);
  }
  if (updates.carryoverMaxDays !== undefined) {
    setClauses.push('carryover_max_days = ?');
    params.push(updates.carryoverMaxDays);
  }
  if (updates.carryoverExpiryDate !== undefined) {
    setClauses.push('carryover_expiry_date = ?');
    params.push(updates.carryoverExpiryDate);
  }
  if (updates.sickLeaveAuThreshold !== undefined) {
    setClauses.push('sick_leave_au_threshold = ?');
    params.push(updates.sickLeaveAuThreshold);
  }
  if (updates.requireApproval !== undefined) {
    setClauses.push('require_approval = ?');
    params.push(updates.requireApproval ? 1 : 0);
  }
  if (updates.autoApproveThreshold !== undefined) {
    setClauses.push('auto_approve_threshold = ?');
    params.push(updates.autoApproveThreshold);
  }

  if (setClauses.length === 0) {
    return badRequest('No fields to update');
  }

  setClauses.push('updated_at = ?');
  params.push(now);
  params.push(membership.organization_id);

  await db
    .prepare(`UPDATE organizations SET ${setClauses.join(', ')} WHERE id = ?`)
    .bind(...params)
    .run();

  // Fetch updated organization
  const updated = await db
    .prepare('SELECT * FROM organizations WHERE id = ?')
    .bind(membership.organization_id)
    .first<Record<string, unknown>>();

  if (!updated) {
    return badRequest('Organization not found');
  }

  return success({
    id: updated.id,
    name: updated.name,
    slug: updated.slug,
    country: updated.country,
    region: updated.region ?? updated.bundesland ?? null,
    defaultVacationDays: updated.default_vacation_days,
    carryoverEnabled: Boolean(updated.carryover_enabled),
    carryoverMaxDays: updated.carryover_max_days,
    carryoverExpiryDate: updated.carryover_expiry_date,
    sickLeaveAuThreshold: updated.sick_leave_au_threshold,
    requireApproval: Boolean(updated.require_approval),
    autoApproveThreshold: updated.auto_approve_threshold,
  });
}
