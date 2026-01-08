import { NextRequest } from 'next/server';

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { z } from 'zod';

import { auth } from '~/lib/auth/auth';
import {
  badRequest,
  forbidden,
  noContent,
  notFound,
  success,
  unauthorized,
  validationError,
} from '~/lib/api/responses';


interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateHolidaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  nameEn: z.string().min(1, 'English name is required').optional(),
  nameDe: z.string().min(1, 'German name is required').optional(),
  type: z.enum(['public', 'company', 'optional']).optional(),
  isHalfDay: z.boolean().optional(),
});

/**
 * GET /api/holidays/[id]
 * Get a specific holiday
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return unauthorized();
  }

  const { id } = await params;
  const { env } = getCloudflareContext();
  const db = env.DB;

  const holiday = await db
    .prepare('SELECT * FROM public_holidays WHERE id = ?')
    .bind(id)
    .first<Record<string, unknown>>();

  if (!holiday) {
    return notFound('Holiday');
  }

  return success({
    id: holiday.id,
    date: holiday.date,
    nameEn: holiday.name_en,
    nameDe: holiday.name_de,
    region: holiday.bundesland,
    type: holiday.type,
    isHalfDay: Boolean(holiday.is_half_day),
    isCompanyHoliday: holiday.organization_id !== null,
  });
}

/**
 * PUT /api/holidays/[id]
 * Update a company-specific holiday
 * Requires admin, manager, or hr role
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return unauthorized();
  }

  const { id } = await params;
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

  if (!['admin', 'manager', 'hr'].includes(membership.role)) {
    return forbidden('Only admins, managers, and HR can update holidays');
  }

  // Get the holiday and verify it belongs to the organization
  const holiday = await db
    .prepare('SELECT * FROM public_holidays WHERE id = ?')
    .bind(id)
    .first<Record<string, unknown>>();

  if (!holiday) {
    return notFound('Holiday');
  }

  // Can only update company-specific holidays
  if (holiday.organization_id === null) {
    return forbidden('Cannot modify system holidays');
  }

  if (holiday.organization_id !== membership.organization_id) {
    return forbidden('Cannot modify holidays from other organizations');
  }

  const body = await request.json();
  const parsed = updateHolidaySchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error.flatten());
  }

  const updates = parsed.data;

  // Build dynamic update query
  const setClauses: string[] = [];
  const updateParams: (string | number)[] = [];

  if (updates.date !== undefined) {
    setClauses.push('date = ?');
    updateParams.push(updates.date);
  }
  if (updates.nameEn !== undefined) {
    setClauses.push('name_en = ?');
    updateParams.push(updates.nameEn);
  }
  if (updates.nameDe !== undefined) {
    setClauses.push('name_de = ?');
    updateParams.push(updates.nameDe);
  }
  if (updates.type !== undefined) {
    setClauses.push('type = ?');
    updateParams.push(updates.type);
  }
  if (updates.isHalfDay !== undefined) {
    setClauses.push('is_half_day = ?');
    updateParams.push(updates.isHalfDay ? 1 : 0);
  }

  if (setClauses.length === 0) {
    return badRequest('No fields to update');
  }

  updateParams.push(id);

  await db
    .prepare(`UPDATE public_holidays SET ${setClauses.join(', ')} WHERE id = ?`)
    .bind(...updateParams)
    .run();

  // Fetch updated holiday
  const updated = await db
    .prepare('SELECT * FROM public_holidays WHERE id = ?')
    .bind(id)
    .first<Record<string, unknown>>();

  return success({
    id: updated?.id,
    date: updated?.date,
    nameEn: updated?.name_en,
    nameDe: updated?.name_de,
    type: updated?.type,
    isHalfDay: Boolean(updated?.is_half_day),
    isCompanyHoliday: true,
  });
}

/**
 * DELETE /api/holidays/[id]
 * Delete a company-specific holiday
 * Requires admin, manager, or hr role
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return unauthorized();
  }

  const { id } = await params;
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

  if (!['admin', 'manager', 'hr'].includes(membership.role)) {
    return forbidden('Only admins, managers, and HR can delete holidays');
  }

  // Get the holiday and verify it belongs to the organization
  const holiday = await db
    .prepare('SELECT * FROM public_holidays WHERE id = ?')
    .bind(id)
    .first<Record<string, unknown>>();

  if (!holiday) {
    return notFound('Holiday');
  }

  // Can only delete company-specific holidays
  if (holiday.organization_id === null) {
    return forbidden('Cannot delete system holidays');
  }

  if (holiday.organization_id !== membership.organization_id) {
    return forbidden('Cannot delete holidays from other organizations');
  }

  await db.prepare('DELETE FROM public_holidays WHERE id = ?').bind(id).run();

  return noContent();
}
