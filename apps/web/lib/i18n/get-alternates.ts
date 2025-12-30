import { headers } from 'next/headers';

import appConfig from '~/config/app.config';

import { DEFAULT_LOCALE, LOCALES, type Locale } from './locales.config';
import { getCanonicalSlug, getLocalizedPath } from './slug-translations';

/**
 * Get alternate language URLs for hreflang tags.
 * Detects current path from headers and generates alternates for all locales.
 */
export async function getAlternates(): Promise<{
  canonical: string;
  languages: Record<string, string>;
}> {
  const headersStore = await headers();
  const baseUrl = appConfig.url.endsWith('/')
    ? appConfig.url.slice(0, -1)
    : appConfig.url;

  // Get the current locale from header (set by middleware)
  const currentLocale = (headersStore.get('x-locale') as Locale) || DEFAULT_LOCALE;

  // Get the canonical slug from header (set by middleware for non-default locales)
  // or extract from the pathname
  let canonicalPath = headersStore.get('x-canonical-slug') || '';

  // If no canonical slug header, we're on a default locale page
  // Try to extract the path from the URL
  if (!canonicalPath) {
    const url = headersStore.get('x-url') || headersStore.get('x-forwarded-url') || '';
    if (url) {
      try {
        const parsedUrl = new URL(url);
        const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);

        // Check if first segment is a locale
        if (pathSegments[0] && LOCALES.includes(pathSegments[0] as Locale)) {
          // Non-default locale - get canonical from translated slug
          const translatedSlug = pathSegments.slice(1).join('/');
          canonicalPath = getCanonicalSlug(translatedSlug, pathSegments[0] as Locale) || '';
        } else {
          // Default locale - path is the canonical path
          canonicalPath = pathSegments.join('/');
        }
      } catch {
        // If URL parsing fails, use empty path (home)
        canonicalPath = '';
      }
    }
  }

  // Build alternates object
  const languages: Record<string, string> = {};

  LOCALES.forEach((locale) => {
    const localizedPath = getLocalizedPath(canonicalPath, locale);
    languages[locale] = `${baseUrl}${localizedPath}`;
  });

  // Add x-default pointing to default locale
  languages['x-default'] = `${baseUrl}${getLocalizedPath(canonicalPath, DEFAULT_LOCALE)}`;

  // Canonical URL is the URL for the current locale
  const canonical = languages[currentLocale] ?? languages[DEFAULT_LOCALE] ?? `${baseUrl}/`;

  return {
    canonical,
    languages,
  };
}

/**
 * Get alternate language URLs for a specific canonical path.
 * Use this when you know the canonical path (e.g., in generateMetadata).
 */
export function getAlternatesForPath(canonicalPath: string): {
  canonical: string;
  languages: Record<string, string>;
} {
  const baseUrl = appConfig.url.endsWith('/')
    ? appConfig.url.slice(0, -1)
    : appConfig.url;

  // Build alternates object
  const languages: Record<string, string> = {};

  LOCALES.forEach((locale) => {
    const localizedPath = getLocalizedPath(canonicalPath, locale);
    languages[locale] = `${baseUrl}${localizedPath}`;
  });

  // Add x-default pointing to default locale
  languages['x-default'] = `${baseUrl}${getLocalizedPath(canonicalPath, DEFAULT_LOCALE)}`;

  // Canonical URL is the default locale version
  const canonical = languages[DEFAULT_LOCALE] ?? `${baseUrl}/`;

  return {
    canonical,
    languages,
  };
}
