import { getCloudflareContext } from '@opennextjs/cloudflare';
import { redirect } from 'next/navigation';

import { auth } from '~/lib/auth/auth';

/**
 * Check if the current user has completed onboarding.
 * If not, redirect to the onboarding flow.
 *
 * This function should be called at the top of server components
 * that require a completed onboarding (e.g., home page).
 */
export async function requireOnboardingComplete() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/sign-in');
  }

  const { env } = getCloudflareContext();
  const db = env.DB;

  // Check if user has an organization membership
  const membership = await db
    .prepare(
      `SELECT om.id, om.organization_id, om.role, o.name as org_name
       FROM organization_members om
       JOIN organizations o ON o.id = om.organization_id
       WHERE om.user_id = ? AND om.status = 'active'
       LIMIT 1`
    )
    .bind(session.user.id)
    .first();

  if (!membership) {
    // User has no organization, redirect to onboarding
    redirect('/onboarding');
  }

  return {
    userId: session.user.id,
    organizationId: membership.organization_id as string,
    organizationName: membership.org_name as string,
    role: membership.role as string,
  };
}

/**
 * Check if the user has already completed onboarding.
 * If so, redirect to the home page.
 *
 * This function should be called at the top of onboarding pages
 * to prevent users who already have an organization from going through
 * onboarding again.
 */
export async function requireOnboardingIncomplete() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/sign-in');
  }

  const { env } = getCloudflareContext();
  const db = env.DB;

  // Check if user has an organization membership
  const membership = await db
    .prepare(
      `SELECT id FROM organization_members
       WHERE user_id = ? AND status = 'active'
       LIMIT 1`
    )
    .bind(session.user.id)
    .first();

  if (membership) {
    // User already has an organization, redirect to home
    redirect('/home');
  }

  return {
    userId: session.user.id,
  };
}

/**
 * Get the current user's organization context.
 * Returns null if user has no organization.
 */
export async function getUserOrganization() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const { env } = getCloudflareContext();
  const db = env.DB;

  const result = await db
    .prepare(
      `SELECT
         om.id as member_id,
         om.role,
         om.custom_vacation_days,
         o.id as organization_id,
         o.name as organization_name,
         o.slug,
         o.country,
         o.region,
         o.default_vacation_days,
         o.carryover_enabled,
         o.carryover_max_days
       FROM organization_members om
       JOIN organizations o ON o.id = om.organization_id
       WHERE om.user_id = ? AND om.status = 'active'
       LIMIT 1`
    )
    .bind(session.user.id)
    .first();

  if (!result) {
    return null;
  }

  return {
    memberId: result.member_id as string,
    role: result.role as string,
    customVacationDays: result.custom_vacation_days as number | null,
      organization: {
        id: result.organization_id as string,
        name: result.organization_name as string,
        slug: result.slug as string,
        country: result.country as string,
        region: result.region as string | null,
        defaultVacationDays: result.default_vacation_days as number,
        carryoverEnabled: Boolean(result.carryover_enabled),
        carryoverMaxDays: result.carryover_max_days as number,
    },
  };
}
