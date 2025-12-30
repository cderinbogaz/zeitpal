import { NextRequest } from 'next/server';

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { z } from 'zod';

import { success, validationError } from '~/lib/api/responses';


const checkSlugSchema = z.object({
  slug: z
    .string()
    .min(2, 'URL must be at least 2 characters')
    .max(50, 'URL must be at most 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
});

/**
 * POST /api/organizations/check-slug
 * Check if an organization slug is available
 * This endpoint is public to allow checking during onboarding
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = checkSlugSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error.flatten());
  }

  const { slug } = parsed.data;

  const { env } = getCloudflareContext();
  const db = env.DB;

  // Check if slug is already taken
  const existingOrg = await db
    .prepare('SELECT id FROM organizations WHERE slug = ?')
    .bind(slug)
    .first();

  return success({
    available: !existingOrg,
    slug,
  });
}
