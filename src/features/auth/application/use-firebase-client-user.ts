"use client";

import { onIdTokenChanged, type User } from "firebase/auth";
import { useEffect, useRef, useState } from "react";

import { isUserRole, type UserRole } from "@/core/auth/roles";
import { isFirebaseClientConfigured } from "@/core/env/public";
import { getClientAuth } from "@/lib/firebase/client";

export type FirebaseClientAuthStatus =
  /** İstemci Auth SDK'sı oturumu henüz geri yüklemedi. */
  | "loading"
  /** NEXT_PUBLIC_FIREBASE_* değişkenleri eksik. */
  | "unconfigured"
  /** Tarayıcıda Firebase oturumu yok (sunucu çerezi geçerli olsa bile). */
  | "signed_out"
  /** Oturum var ama token'da admin/dispatcher rolü yok. */
  | "missing_role"
  /** Firestore kuralları için gereken rollü token hazır. */
  | "ready";

export interface FirebaseClientAuthState {
  status: FirebaseClientAuthStatus;
  user: User | null;
  role: UserRole | null;
}

/**
 * @brief İstemci tarafı Firebase oturumunu hazır hale getirir ve rol talebini doğrular.
 *
 * Bu hook yalnızca bilgi vermez, aynı zamanda **gereklidir**: Firestore istemcisi
 * kimlik jetonunu `firebase/auth` bileşeninden alır ve bu bileşen ancak `getAuth()`
 * çağrıldığında kurulur. Sayfa doğrudan açıldığında (örn. panelde F5) `getAuth()`
 * hiç çağrılmazsa Firestore istekleri jetonsuz gider ve kurallar `permission-denied`
 * döndürür. Konum dinleyicileri bu yüzden abone olmadan önce bu hook'u beklemelidir.
 *
 * Sunucu oturum çerezi ile tarayıcıdaki Firebase oturumu birbirinden bağımsız
 * olduğundan, sayfa "girişli" görünürken istemci tarafı çıkış yapmış olabilir;
 * `signed_out` durumu bu farkı görünür kılar.
 *
 * @returns Oturum durumu, kullanıcı ve doğrulanmış rol.
 */
export function useFirebaseClientUser(): FirebaseClientAuthState {
  const configured = isFirebaseClientConfigured();
  const [state, setState] = useState<FirebaseClientAuthState>({
    status: configured ? "loading" : "unconfigured",
    user: null,
    role: null,
  });

  // Rol talebi eksik olan her kullanıcı için jeton yalnızca bir kez zorla
  // yenilenir; aksi halde yenileme dinleyiciyi yeniden tetikleyip döngü yaratır.
  const refreshedUidsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!configured) return;

    let cancelled = false;

    const unsubscribe = onIdTokenChanged(getClientAuth(), async (user) => {
      if (cancelled) return;

      if (!user) {
        setState({ status: "signed_out", user: null, role: null });
        return;
      }

      try {
        let result = await user.getIdTokenResult();

        // Özel talepler (custom claims) girişten sonra atandıysa önbellekteki
        // jetonda görünmez; bir kereliğine zorla yenileyip tekrar bakılır.
        if (
          !isUserRole(result.claims.role) &&
          !refreshedUidsRef.current.has(user.uid)
        ) {
          refreshedUidsRef.current.add(user.uid);
          result = await user.getIdTokenResult(true);
        }

        if (cancelled) return;

        const role = result.claims.role;
        setState(
          isUserRole(role)
            ? { status: "ready", user, role }
            : { status: "missing_role", user, role: null },
        );
      } catch {
        if (!cancelled) {
          setState({ status: "signed_out", user: null, role: null });
        }
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [configured]);

  return state;
}

/**
 * @brief İstemci oturum durumunu kullanıcıya gösterilecek Türkçe mesaja çevirir.
 * @param status Oturum durumu.
 * @returns Gösterilecek mesaj ve ipucu; sorun yoksa null.
 */
export function describeAuthStatus(
  status: FirebaseClientAuthStatus,
): { message: string; hint?: string } | null {
  switch (status) {
    case "unconfigured":
      return {
        message: "Firebase istemci yapılandırması eksik.",
        hint: "Sunucudaki NEXT_PUBLIC_FIREBASE_* değişkenlerini tamamlayın.",
      };
    case "signed_out":
      return {
        message: "Tarayıcı oturumu bulunamadı.",
        hint: "Panel oturumunuz açık görünse de canlı takip için Firebase oturumu gerekiyor. Çıkış yapıp tekrar giriş yapın.",
      };
    case "missing_role":
      return {
        message: "Hesabınızda admin veya dispatcher rolü tanımlı değil.",
        hint: "Bir yöneticiden hesabınıza rol atamasını isteyin, ardından tekrar giriş yapın.",
      };
    default:
      return null;
  }
}
