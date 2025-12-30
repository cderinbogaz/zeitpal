import type { NextRequest } from 'next/server';
import { NextResponse, URLPattern } from 'next/server';

import { CsrfError, createCsrfProtect } from '@edge-csrf/nextjs';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getToken } from 'next-auth/jwt';

import appConfig from '~/config/app.config';
import pathsConfig from '~/config/paths.config';
import { DEFAULT_LOCALE, isValidLocale } from '~/lib/i18n/locales.config';
import { getCanonicalSlug } from '~/lib/i18n/slug-translations';

const CSRF_SECRET_COOKIE = 'csrfSecret';
const NEXT_ACTION_HEADER = 'next-action';
const LOCALE_COOKIE = 'lang'; // Must match I18N_COOKIE_NAME in i18n.settings.ts

export const config = {
  matcher: ['/((?!_next/static|_next/image|images|locales|assets|api/auth|api/onboarding).*)'],
};

/**
 * Get the authenticated user from the JWT token
 */
async function getUser(request: NextRequest) {
  try {
    // Get secret from Cloudflare runtime context, fallback to process.env for local dev
    let secret: string | undefined;
    try {
      const { env } = getCloudflareContext();
      secret = (env as unknown as Record<string, string | undefined>)?.AUTH_SECRET;
    } catch {
      // Not in Cloudflare runtime (local dev)
    }
    secret = secret ?? process.env.AUTH_SECRET;

    // Debug: Log context availability (remove after debugging)
    console.log('[Middleware Debug]', {
      hasSecret: !!secret,
      secretLength: secret?.length,
      cookies: request.cookies.getAll().map(c => c.name),
    });

    const token = await getToken({
      req: request,
      secret,
    });

    console.log('[Middleware Debug] Token:', !!token);

    return token;
  } catch (error) {
    console.error('[Middleware Error]', error);
    return null;
  }
}

/**
 * Handle locale routing for marketing pages.
 * Rewrites localized URLs to base marketing pages and sets locale cookie.
 * e.g., /de/funktionen → /features (with locale cookie set to 'de')
 */
function handleLocaleRouting(
  request: NextRequest,
  response: NextResponse,
): NextResponse | null {
  const { pathname } = request.nextUrl;

  // Skip non-marketing routes that don't need locale routing
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/home') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/update-password') ||
    pathname.includes('.') // static files
  ) {
    return null;
  }

  // Check if path starts with a locale
  const pathSegments = pathname.split('/').filter(Boolean);
  const potentialLocale = pathSegments[0];

  // Handle non-default locale paths (e.g., /de/funktionen)
  if (
    potentialLocale &&
    isValidLocale(potentialLocale) &&
    potentialLocale !== DEFAULT_LOCALE
  ) {
    const locale = potentialLocale;
    const restOfPath = pathSegments.slice(1).join('/');

    // Home page for this locale - rewrite to /
    if (restOfPath === '') {
      const url = request.nextUrl.clone();
      url.pathname = '/';

      const rewriteResponse = NextResponse.rewrite(url);
      rewriteResponse.cookies.set(LOCALE_COOKIE, locale, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 year
      });
      rewriteResponse.headers.set('x-locale', locale);
      rewriteResponse.headers.set('x-url', request.nextUrl.href);
      rewriteResponse.headers.set('x-canonical-slug', '');
      return rewriteResponse;
    }

    // Get canonical slug from translated slug
    const canonicalSlug = getCanonicalSlug(restOfPath, locale);

    if (canonicalSlug !== null) {
      // Valid locale route - rewrite to canonical path
      const url = request.nextUrl.clone();
      url.pathname = `/${canonicalSlug}`;

      const rewriteResponse = NextResponse.rewrite(url);
      rewriteResponse.cookies.set(LOCALE_COOKIE, locale, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 year
      });
      rewriteResponse.headers.set('x-locale', locale);
      rewriteResponse.headers.set('x-url', request.nextUrl.href);
      rewriteResponse.headers.set('x-canonical-slug', canonicalSlug);
      return rewriteResponse;
    }

    // Invalid translated slug - let Next.js handle 404
    return null;
  }

  // For default locale paths (English), reset the cookie to default locale
  // This ensures users who explicitly navigate to English paths get English content
  // and clears any stale locale cookies from previous sessions
  response.cookies.set(LOCALE_COOKIE, DEFAULT_LOCALE, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
  response.headers.set('x-locale', DEFAULT_LOCALE);
  response.headers.set('x-url', request.nextUrl.href);

  return null;
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // set a unique request ID for each request
  // this helps us log and trace requests
  setRequestId(response);

  // handle locale routing for marketing pages
  const localeResponse = handleLocaleRouting(request, response);
  if (localeResponse) {
    return localeResponse;
  }

  // apply CSRF protection for mutating requests
  const csrfResponse = await withCsrfMiddleware(request, response);

  // handle patterns for specific routes
  const handlePattern = matchUrlPattern(request.url);

  // if a pattern handler exists, call it
  if (handlePattern) {
    const patternHandlerResponse = await handlePattern(request, csrfResponse);

    // if a pattern handler returns a response, return it
    if (patternHandlerResponse) {
      return patternHandlerResponse;
    }
  }

  // append the action path to the request headers
  // which is useful for knowing the action path in server actions
  if (isServerAction(request)) {
    csrfResponse.headers.set('x-action-path', request.nextUrl.pathname);
  }

  // if no pattern handler returned a response,
  // return the session response
  return csrfResponse;
}

async function withCsrfMiddleware(
  request: NextRequest,
  response = new NextResponse(),
) {
  // set up CSRF protection
  const csrfProtect = createCsrfProtect({
    cookie: {
      secure: appConfig.production,
      name: CSRF_SECRET_COOKIE,
    },
    // ignore CSRF errors for server actions since protection is built-in
    ignoreMethods: isServerAction(request)
      ? ['POST']
      : // always ignore GET, HEAD, and OPTIONS requests
        ['GET', 'HEAD', 'OPTIONS'],
  });

  try {
    await csrfProtect(request, response);

    return response;
  } catch (error) {
    // if there is a CSRF error, return a 403 response
    if (error instanceof CsrfError) {
      return NextResponse.json('Invalid CSRF token', {
        status: 401,
      });
    }

    throw error;
  }
}

function isServerAction(request: NextRequest) {
  const headers = new Headers(request.headers);

  return headers.has(NEXT_ACTION_HEADER);
}

/**
 * Define URL patterns and their corresponding handlers.
 */
function getPatterns() {
  return [
    {
      pattern: new URLPattern({ pathname: '/auth/*?' }),
      handler: async (req: NextRequest, _res: NextResponse) => {
        const token = await getUser(req);

        // the user is logged out, so we don't need to do anything
        if (!token) {
          return;
        }

        // check if we need to verify MFA (user is authenticated but needs to verify MFA)
        const isVerifyMfa = req.nextUrl.pathname === pathsConfig.auth.verifyMfa;

        // If user is logged in and does not need to verify MFA,
        // redirect to home page.
        if (!isVerifyMfa) {
          return NextResponse.redirect(
            new URL(pathsConfig.app.home, req.nextUrl.origin).href,
          );
        }
      },
    },
    {
      pattern: new URLPattern({ pathname: '/home/*?' }),
      handler: async (req: NextRequest, _res: NextResponse) => {
        const token = await getUser(req);

        const origin = req.nextUrl.origin;
        const next = req.nextUrl.pathname;

        // If user is not logged in, redirect to sign in page.
        if (!token) {
          const signIn = pathsConfig.auth.signIn;
          const redirectPath = `${signIn}?next=${next}`;

          return NextResponse.redirect(new URL(redirectPath, origin).href);
        }

        // Note: Onboarding completion check is done in the home layout/page
        // using server-side database queries, not in middleware.
        // This avoids the complexity of database access in edge middleware.
        return;
      },
    },
    {
      pattern: new URLPattern({ pathname: '/onboarding/*?' }),
      handler: async (req: NextRequest, _res: NextResponse) => {
        const token = await getUser(req);

        const origin = req.nextUrl.origin;

        // If user is not logged in, redirect to sign in page.
        if (!token) {
          return NextResponse.redirect(
            new URL(pathsConfig.auth.signIn, origin).href,
          );
        }

        // User is authenticated, allow access to onboarding
        return;
      },
    },
  ];
}

/**
 * Match URL patterns to specific handlers.
 * @param url
 */
function matchUrlPattern(url: string) {
  const patterns = getPatterns();
  const input = url.split('?')[0];

  for (const pattern of patterns) {
    const patternResult = pattern.pattern.exec(input);

    if (patternResult !== null && 'pathname' in patternResult) {
      return pattern.handler;
    }
  }
}

/**
 * Set a unique request ID for each request.
 * @param response
 */
function setRequestId(response: NextResponse) {
  response.headers.set('x-correlation-id', crypto.randomUUID());
}
