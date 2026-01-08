'use client';

import type { InitOptions, i18n } from 'i18next';

import { initializeI18nClient } from './i18n.client';

let i18nInstance: i18n | undefined;
let loadingPromise: Promise<i18n> | undefined;
let loadingKey: string | undefined;

type Resolver = (
  lang: string,
  namespace: string,
) => Promise<Record<string, string>>;

export function I18nProvider({
  settings,
  children,
  resolver,
}: React.PropsWithChildren<{
  settings: InitOptions;
  resolver: Resolver;
}>) {
  useI18nClient(settings, resolver);

  return children;
}

/**
 * @name useI18nClient
 * @description A hook that initializes the i18n client.
 * @param settings
 * @param resolver
 */
function useI18nClient(settings: InitOptions, resolver: Resolver) {
  // Create a unique key for this configuration
  const currentKey = `${settings.lng}-${JSON.stringify(settings.ns)}`;

  // If we have a valid instance for this configuration, return it
  if (i18nInstance && loadingKey === currentKey) {
    return i18nInstance;
  }

  // If we're already loading this configuration, throw the promise for Suspense
  if (loadingPromise && loadingKey === currentKey) {
    throw loadingPromise;
  }

  // Start loading with a new promise
  loadingKey = currentKey;
  loadingPromise = loadI18nInstance(settings, resolver);

  // Throw the promise to trigger Suspense
  throw loadingPromise;
}

async function loadI18nInstance(
  settings: InitOptions,
  resolver: Resolver,
): Promise<i18n> {
  try {
    i18nInstance = await initializeI18nClient(settings, resolver);
    return i18nInstance;
  } catch (error) {
    console.error('Error loading i18n instance:', error);
    // Reset so we can retry
    loadingPromise = undefined;
    throw error;
  }
}
