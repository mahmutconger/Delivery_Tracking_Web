import { z } from "zod";

const serverEnvSchema = z.object({
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_STORAGE_BUCKET: z.string().optional(),
  SESSION_COOKIE_NAME: z.string().default("delivery_admin_session"),
  SESSION_COOKIE_MAX_AGE_MS: z.coerce.number().default(60 * 60 * 24 * 5 * 1000),
  MAP_GEOCODE_ENDPOINT: z.string().optional(),
  MAP_GEOCODE_API_KEY: z.string().optional(),
  APP_BASE_URL: z.string().optional(),
});

export const serverEnv = serverEnvSchema.parse({
  FIREBASE_PROJECT_ID:
    process.env.FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
  FIREBASE_STORAGE_BUCKET:
    process.env.FIREBASE_STORAGE_BUCKET ??
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME,
  SESSION_COOKIE_MAX_AGE_MS: process.env.SESSION_COOKIE_MAX_AGE_MS,
  MAP_GEOCODE_ENDPOINT: process.env.MAP_GEOCODE_ENDPOINT,
  MAP_GEOCODE_API_KEY: process.env.MAP_GEOCODE_API_KEY,
  APP_BASE_URL: process.env.APP_BASE_URL,
});

export function isFirebaseAdminConfigured() {
  return Boolean(
    serverEnv.FIREBASE_PROJECT_ID &&
      serverEnv.FIREBASE_CLIENT_EMAIL &&
      serverEnv.FIREBASE_PRIVATE_KEY,
  );
}
