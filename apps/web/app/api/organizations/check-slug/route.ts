import { NextRequest } from 'next/server';

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { z } from 'zod';

import { badRequest, success, validationError } from '~/lib/api/responses';

const checkSlugSchema = z.object({
  slug: z
    .string()
    .min(2, 'URL must be at least 2 characters')
    .max(50, 'URL must be at most 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
});

/**
 * GET /api/organizations/check-slug?slug=<slug>
 * Check if an organization slug is available
 * This endpoint is public to allow checking during onboarding
 * Uses GET to avoid CSRF token requirements for this read-only operation
 */
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug');

  if (!slug) {
    return badRequest('Missing slug parameter');
  }

  const parsed = checkSlugSchema.safeParse({ slug });

  if (!parsed.success) {
    return validationError(parsed.error.flatten());
  }

  const { env } = getCloudflareContext();
  const db = env.DB;

  // Check if slug is already taken
  const existingOrg = await db
    .prepare('SELECT id FROM organizations WHERE slug = ?')
    .bind(parsed.data.slug)
    .first();

  return success({
    available: !existingOrg,
    slug: parsed.data.slug,
  });
}
