import { NextRequest } from 'next/server';

import { getCloudflareContext } from '@opennextjs/cloudflare';

import { auth } from '~/lib/auth/auth';
import { badRequest, success, unauthorized } from '~/lib/api/responses';


/**
 * GET /api/leave-types
 * Get available leave types for the user's organization
 */
export async function GET(_request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return unauthorized();
  }

  const { env } = getCloudflareContext();
  const db = env.DB;

  // Get user's organization
  const member = await db
    .prepare(
      `SELECT organization_id FROM organization_members
       WHERE user_id = ? AND status = 'active' LIMIT 1`
    )
    .bind(session.user.id)
    .first<{ organization_id: string }>();

  const organizationId = member?.organization_id;

  // Get leave types (system defaults + organization-specific)
  // For admin view, show all leave types regardless of active status
  const results = await db
    .prepare(
      `SELECT * FROM leave_types
       WHERE organization_id IS NULL OR organization_id = ?
       ORDER BY sort_order`
    )
    .bind(organizationId ?? null)
    .all();

  // Transform results
  const leaveTypes = results.results.map((row: Record<string, unknown>) => ({
    id: row.id,
    code: row.code,
    nameEn: row.name_en,
    nameDe: row.name_de,
    descriptionEn: row.description_en,
    descriptionDe: row.description_de,
    color: row.color,
    icon: row.icon,
    isPaid: Boolean(row.is_paid),
    requiresApproval: Boolean(row.requires_approval),
    requiresDocument: Boolean(row.requires_document),
    documentRequiredAfterDays: row.document_required_after_days,
    hasAllowance: Boolean(row.has_allowance),
    defaultDaysPerYear: row.default_days_per_year,
    allowNegative: Boolean(row.allow_negative),
    allowHalfDays: Boolean(row.allow_half_days),
    allowCarryover: Boolean(row.allow_carryover),
    maxCarryoverDays: row.max_carryover_days,
    isActive: Boolean(row.is_active),
    sortOrder: row.sort_order,
  }));

  return success(leaveTypes);
}

/**
 * PATCH /api/leave-types
 * Update a leave type's active status
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return unauthorized('Not authenticated');
    }

    const { env } = getCloudflareContext();
    const db = env.DB;

    // Get user's organization and check admin status
    const member = await db
      .prepare(
        `SELECT organization_id, role FROM organization_members
         WHERE user_id = ? AND status = 'active' LIMIT 1`
      )
      .bind(session.user.id)
      .first<{ organization_id: string; role: string }>();

    if (!member) {
      return unauthorized('No active organization membership found');
    }

    // Only admins can modify leave types
    if (member.role !== 'admin' && member.role !== 'owner') {
      return unauthorized('Only admins can modify leave types');
    }

    const body = await request.json();
    const { id, isActive } = body;

    if (!id || typeof isActive !== 'boolean') {
      return badRequest('Invalid request body: id and isActive are required');
    }

    // Update the leave type's is_active status
    // Note: For system-wide leave types (organization_id IS NULL), this affects all orgs
    // TODO: Add organization_leave_type_settings table for per-org overrides
    const result = await db
      .prepare(
        `UPDATE leave_types SET is_active = ?, updated_at = datetime('now') WHERE id = ?`
      )
      .bind(isActive ? 1 : 0, id)
      .run();

    if (!result.meta.changes) {
      return badRequest('Leave type not found or already in requested state');
    }

    return success({ id, isActive });
  } catch (error) {
    console.error('Error updating leave type:', error);
    return badRequest(
      `Failed to update leave type: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
