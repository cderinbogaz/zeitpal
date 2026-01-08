export const EMAIL_SPLIT_REGEX = /[,\s]+/;

export function splitEmails(value: string): string[] {
  return value
    .split(EMAIL_SPLIT_REGEX)
    .map((email) => email.trim())
    .filter(Boolean);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function mergeEmails(existing: string[], incoming: string[]): string[] {
  const seen = new Set(existing.map((email) => normalizeEmail(email)));
  const next = [...existing];

  for (const email of incoming) {
    const normalized = normalizeEmail(email);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    next.push(normalized);
  }

  return next;
}

export function collectEmails(existing: string[], inputValue: string): string[] {
  return mergeEmails(existing, splitEmails(inputValue));
}
