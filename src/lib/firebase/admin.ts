import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

import { isFirebaseAdminConfigured, serverEnv } from "@/core/env/server";

function getAdminApp() {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("Firebase Admin environment variables are missing.");
  }

  return getApps().length
    ? getApp()
    : initializeApp({
        credential: cert({
          projectId: serverEnv.FIREBASE_PROJECT_ID,
          clientEmail: serverEnv.FIREBASE_CLIENT_EMAIL,
          privateKey: serverEnv.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
        storageBucket: serverEnv.FIREBASE_STORAGE_BUCKET,
      });
}

export function isAdminAvailable() {
  return isFirebaseAdminConfigured();
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}

export function getAdminStorage() {
  return getStorage(getAdminApp());
}
