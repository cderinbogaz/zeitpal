import { NextRequest } from 'next/server';

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { z } from 'zod';

import { auth } from '~/lib/auth/auth';
import {
  badRequest,
  created,
  forbidden,
  success,
  unauthorized,
  validationError,
} from '~/lib/api/responses';

interface HolidayRow {
  id: string;
  organization_id: string | null;
  date: string;
  name_en: string;
  name_de: string;
  bundesland: string | null;
  type: string;
  is_half_day: number;
}


const querySchema = z.object({
  year: z.coerce.number().min(2020).max(2030).optional(),
  country: z.string().min(2).max(5).optional(),
  region: z.string().min(1).max(10).optional(),
  includeCompany: z.coerce.boolean().optional(),
});

const createHolidaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  nameEn: z.string().min(1, 'English name is required'),
  nameDe: z.string().min(1, 'German name is required'),
  type: z.enum(['public', 'company', 'optional']).default('company'),
  isHalfDay: z.boolean().default(false),
});

/**
 * GET /api/holidays
 * Get public holidays for a given year and/or region
 */
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return unauthorized();
  }

  const searchParams = request.nextUrl.searchParams;
  const query = querySchema.safeParse({
    year: searchParams.get('year') ?? undefined,
    country: searchParams.get('country') ?? undefined,
    region: searchParams.get('region') ?? searchParams.get('bundesland') ?? undefined,
    includeCompany: searchParams.get('includeCompany') ?? undefined,
  });

  if (!query.success) {
    return validationError(query.error.flatten());
  }

  const { year, country, region, includeCompany } = query.data;
  const { env } = getCloudflareContext();
  const db = env.DB;

  // Get user's organization
  const membership = await db
    .prepare(
      `SELECT om.organization_id, o.country, o.region, o.bundesland
       FROM organization_members om
       JOIN organizations o ON om.organization_id = o.id
       WHERE om.user_id = ? AND om.status = 'active'
       LIMIT 1`
    )
    .bind(session.user.id)
    .first<{ organization_id: string; country: string; region: string | null; bundesland: string | null }>();

  const effectiveCountry = country ?? membership?.country ?? 'DE';
  const effectiveRegion = region ?? membership?.region ?? membership?.bundesland ?? null;
  const effectiveYear = year ?? new Date().getFullYear();

  // Build query based on parameters
  let sql = `SELECT * FROM public_holidays WHERE strftime('%Y', date) = ?`;
  const params: (string | number)[] = [String(effectiveYear)];

  if (includeCompany && membership) {
    // Include system holidays + company-specific holidays
    sql += ' AND (organization_id IS NULL OR organization_id = ?)';
    params.push(membership.organization_id);
    sql += ' AND (organization_id IS NOT NULL OR country = ?)';
    params.push(effectiveCountry);
  } else {
    // Only system holidays
    sql += ' AND organization_id IS NULL';
    sql += ' AND country = ?';
    params.push(effectiveCountry);
  }

  if (effectiveRegion) {
    // Get holidays that apply to this region (national or specific to the state)
    sql += ' AND (bundesland IS NULL OR bundesland = ?)';
    params.push(effectiveRegion);
  }

  sql += ' ORDER BY date ASC';

  const result = await db
    .prepare(sql)
    .bind(...params)
    .all<HolidayRow>();

  const holidays = result.results.map((row: HolidayRow) => ({
    id: row.id,
    date: row.date,
    nameEn: row.name_en,
    nameDe: row.name_de,
    region: row.bundesland,
    type: row.type,
    isHalfDay: Boolean(row.is_half_day),
    isCompanyHoliday: row.organization_id !== null,
    isNational: !row.bundesland,
  }));

  return success(holidays);
}

/**
 * POST /api/holidays
 * Create a company-specific holiday
 * Requires admin, manager, or hr role
 */
export async function POST(request: NextRequest) {
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

  if (!['admin', 'manager', 'hr'].includes(membership.role)) {
    return forbidden('Only admins, managers, and HR can create holidays');
  }

  const body = await request.json();
  const parsed = createHolidaySchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error.flatten());
  }

  const { date, nameEn, nameDe, type, isHalfDay } = parsed.data;
  const holidayId = crypto.randomUUID();
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO public_holidays (
        id, organization_id, date, name_en, name_de, type, is_half_day, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      holidayId,
      membership.organization_id,
      date,
      nameEn,
      nameDe,
      type,
      isHalfDay ? 1 : 0,
      now
    )
    .run();

  return created({
    id: holidayId,
    date,
    nameEn,
    nameDe,
    type,
    isHalfDay,
    isCompanyHoliday: true,
  });
}
