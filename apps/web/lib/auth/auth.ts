import NextAuth from 'next-auth';
import { D1Adapter } from '@auth/d1-adapter';
import { getCloudflareContext } from '@opennextjs/cloudflare';

import { getAuthConfig } from './auth.config';

type AuthEnv = Record<string, string | undefined>;

/**
 * Initialize NextAuth with D1 database adapter
 *
 * The D1 adapter is initialized dynamically per-request since
 * the D1 binding is only available via getCloudflareContext() in
 * Cloudflare Pages edge runtime.
 *
 * In development (Node.js runtime), we use a simpler setup without D1.
 * Note: Email providers (Mailgun) are only available when D1 is available,
 * as they require an adapter to store verification tokens.
 */
async function getAuth() {
  let cfEnv: CloudflareEnv | undefined;

  // Try to get Cloudflare bindings (only available in edge runtime).
  // The async mode works in more contexts than the sync one.
  try {
    const ctx = await getCloudflareContext({ async: true });
    cfEnv = ctx?.env as CloudflareEnv | undefined;
  } catch {
    // Not in edge runtime - fall back to process.env
  }

  const env = (cfEnv ?? process.env) as AuthEnv;
  const authConfig = getAuthConfig(env);
  const secret =
    env.AUTH_SECRET ??
    env.NEXTAUTH_SECRET ??
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET;
  const db = cfEnv?.DB;
  const hasD1 = !!db;

  // Filter out email providers unless a D1 adapter is available.
  const providers = hasD1
    ? authConfig.providers
    : authConfig.providers.filter((provider) => {
        if (typeof provider === 'function') {
          return true; // Keep function providers (they're typically OAuth)
        }
        return provider.type !== 'email';
      });

  return NextAuth({
    ...authConfig,
    providers,
    ...(db ? { adapter: D1Adapter(db) } : {}),
    secret,
  });
}

// Export auth functions that initialize per-request
export async function auth() {
  const { auth } = await getAuth();
  return auth();
}

export async function signIn(
  provider?: string,
  options?: { redirectTo?: string; redirect?: boolean }
) {
  const { signIn } = await getAuth();
  return signIn(provider, options);
}

export async function signOut(options?: { redirectTo?: string }) {
  const { signOut } = await getAuth();
  return signOut(options);
}

// Export handlers for API route
export async function getHandlers() {
  const { handlers } = await getAuth();
  return handlers;
}

// Type exports
export type { Session, User } from 'next-auth';
