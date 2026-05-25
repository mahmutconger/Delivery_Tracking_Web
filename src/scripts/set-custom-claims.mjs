import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import fs from "node:fs";
import path from "node:path";

const [uid, role] = process.argv.slice(2);

if (!uid || !role) {
  console.error("Usage: node src/scripts/set-custom-claims.mjs <uid> <admin|dispatcher>");
  process.exit(1);
}

const envFiles = [".env.local", ".env"];
for (const envFile of envFiles) {
  const resolved = path.resolve(process.cwd(), envFile);
  if (fs.existsSync(resolved) && typeof process.loadEnvFile === "function") {
    process.loadEnvFile(resolved);
  }
}

const requiredEnvVars = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
];

const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);
if (missingEnvVars.length > 0) {
  console.error(
    `Missing required env vars: ${missingEnvVars.join(", ")}. ` +
      "Make sure .env.local contains your Firebase Admin SDK values.",
  );
  process.exit(1);
}

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});

await getAuth().setCustomUserClaims(uid, { role });
console.log(`Custom claim set for ${uid}: ${role}`);
