type I18nResources = Record<string, string>;

export async function i18nResolver(
  language: string,
  namespace: string,
): Promise<I18nResources> {
  const baseUrl =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL ??
        `http://localhost:${process.env.PORT ?? '3000'}`;
  const url = new URL(`/locales/${language}/${namespace}.json`, baseUrl);
  const response = await fetch(url.toString());

  if (!response.ok) {
    // Cancel the response body to prevent stalled HTTP response warnings
    await response.body?.cancel();
    throw new Error(
      `Failed to load i18n file: locales/${language}/${namespace}.json`,
    );
  }

  return (await response.json()) as I18nResources;
}
