/// <reference types="@cloudflare/workers-types" />

// Extend CloudflareEnv to include our bindings
declare global {
  interface CloudflareEnv {
    // Bindings
    DB: D1Database;
    R2: R2Bucket;
    // Public env vars
    NEXT_PUBLIC_SITE_URL: string;
    NEXT_PUBLIC_PRODUCT_NAME: string;
    NEXT_PUBLIC_DEFAULT_LOCALE: string;
    // Secrets (added via wrangler secret put)
    AUTH_SECRET: string;
    AUTH_GOOGLE_ID?: string;
    AUTH_GOOGLE_SECRET?: string;
    AUTH_MICROSOFT_ENTRA_ID_ID?: string;
    AUTH_MICROSOFT_ENTRA_ID_SECRET?: string;
    AUTH_MICROSOFT_ENTRA_ID_TENANT_ID?: string;
    MAILGUN_API_KEY: string;
    MAILGUN_DOMAIN: string;
    AUTH_EMAIL_FROM: string;
  }

  namespace NodeJS {
    interface ProcessEnv {
      AUTH_SECRET: string;
      AUTH_GOOGLE_ID?: string;
      AUTH_GOOGLE_SECRET?: string;
      AUTH_MICROSOFT_ENTRA_ID_ID?: string;
      AUTH_MICROSOFT_ENTRA_ID_SECRET?: string;
      AUTH_MICROSOFT_ENTRA_ID_TENANT_ID?: string;
      AUTH_RESEND_KEY?: string;
      AUTH_EMAIL_FROM?: string;
    }
  }
}

export {};
