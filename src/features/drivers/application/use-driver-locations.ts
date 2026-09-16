"use client";

import { collection, onSnapshot, type FirestoreError } from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";

import { isLocationStale } from "@/core/utils/geo";
import type { DriverLocation } from "@/features/drivers/domain/models";
import {
  describeAuthStatus,
  useFirebaseClientUser,
} from "@/features/auth/application/use-firebase-client-user";
import { getClientDb } from "@/lib/firebase/client";

export type DriverLocationMap = Map<string, DriverLocation>;

export interface LiveListenerError {
  message: string;
  hint?: string;
}

export interface UseDriverLocationsResult {
  locations: DriverLocationMap;
  freshCount: number;
  staleCount: number;
  error: LiveListenerError | null;
  /** Dinleyici kurulu ve en az bir anlık görüntü alındı. */
  isListening: boolean;
  /** Abonelik kuruluyor ya da oturum doğrulanıyor. */
  isConnecting: boolean;
  /** Hatayı temizleyip aboneliği baştan kurar. */
  retry: () => void;
}

/**
 * @brief Firestore hatasını kullanıcıya gösterilebilir Türkçe mesaja çevirir.
 * @param error Firestore dinleyicisinden gelen hata.
 * @returns Mesaj ve giderme ipucu.
 */
function toLiveListenerError(error: FirestoreError): LiveListenerError {
  switch (error.code) {
    case "permission-denied":
      return {
        message: "Sürücü konumlarını okuma izniniz yok.",
        hint: "Firestore kurallarının dağıtıldığından emin olun (firebase deploy --only firestore:rules) ve hesabınızda admin/dispatcher rolü olduğunu doğrulayın.",
      };
    case "unauthenticated":
      return {
        message: "Firebase oturumunuzun süresi dolmuş.",
        hint: "Çıkış yapıp tekrar giriş yapın.",
      };
    case "unavailable":
      return {
        message: "Firestore'a şu anda ulaşılamıyor.",
        hint: "İnternet bağlantınızı kontrol edip tekrar deneyin.",
      };
    default:
      return {
        message: "Canlı konum akışı başlatılamadı.",
        hint: error.message,
      };
  }
}

interface ListenerState {
  locations: DriverLocationMap;
  error: LiveListenerError | null;
  hasSnapshot: boolean;
}

const emptyState: ListenerState = {
  locations: new Map(),
  error: null,
  hasSnapshot: false,
};

/**
 * @brief "drivers_location" koleksiyonunu tek bir onSnapshot dinleyicisiyle izler.
 *
 * Abonelik yalnızca `enabled` true **ve** istemci Firebase oturumu rollü jetonla
 * hazır olduğunda kurulur; aksi halde Firestore istekleri jetonsuz gider ve
 * `permission-denied` alınır (bkz. useFirebaseClientUser).
 *
 * Dönen Map yalnızca en az bir konum belgesi değiştiğinde yeni referans alır;
 * böylece bu Map üzerinden useMemo yapan bileşenler gereksiz yere hesaplamaz.
 *
 * @param enabled Canlı modun açık olup olmadığı.
 */
export function useDriverLocations(enabled: boolean): UseDriverLocationsResult {
  const auth = useFirebaseClientUser();
  const [state, setState] = useState<ListenerState>(emptyState);
  const [attempt, setAttempt] = useState(0);

  // Değişmeyen sürücü kayıtlarını yeniden oluşturmamak için son Map'i saklarız.
  const locationsRef = useRef<DriverLocationMap>(new Map());

  const authIssue = describeAuthStatus(auth.status);
  const canSubscribe = enabled && auth.status === "ready";

  useEffect(() => {
    if (!canSubscribe) return;

    const unsubscribe = onSnapshot(
      collection(getClientDb(), "drivers_location"),
      (snapshot) => {
        const next = new Map<string, DriverLocation>(locationsRef.current);

        snapshot.docChanges().forEach((change) => {
          if (change.type === "removed") {
            next.delete(change.doc.id);
            return;
          }

          const data = change.doc.data();
          next.set(change.doc.id, {
            driverId: change.doc.id,
            latitude: Number(data.latitude ?? 0),
            longitude: Number(data.longitude ?? 0),
            accuracyMeters:
              data.accuracyMeters === undefined
                ? null
                : Number(data.accuracyMeters),
            speedMetersPerSecond:
              data.speedMetersPerSecond === undefined
                ? null
                : Number(data.speedMetersPerSecond),
            recordedAtMillis: Number(data.recordedAtMillis ?? 0),
          });
        });

        locationsRef.current = next;
        setState({ locations: next, error: null, hasSnapshot: true });
      },
      (firestoreError) => {
        setState((current) => ({
          ...current,
          error: toLiveListenerError(firestoreError),
        }));
      },
    );

    return unsubscribe;
  }, [canSubscribe, attempt]);

  const retry = useCallback(() => {
    setState((current) => ({ ...current, error: null }));
    setAttempt((current) => current + 1);
  }, []);

  const freshCount = [...state.locations.values()].filter(
    (location) => !isLocationStale(location.recordedAtMillis),
  ).length;

  return {
    locations: state.locations,
    freshCount,
    staleCount: state.locations.size - freshCount,
    // Oturum kaynaklı sorunlar Firestore hatasının önüne geçer; kullanıcıya
    // "izin yok" yerine asıl nedeni göstermek gerekir.
    error: enabled ? authIssue ?? state.error : null,
    isListening: canSubscribe && state.hasSnapshot && !state.error,
    isConnecting:
      enabled &&
      !state.error &&
      !authIssue &&
      (auth.status === "loading" || !state.hasSnapshot),
    retry,
  };
}
