import { cookies } from "next/headers";

import { AppError } from "@/core/errors/app-error";
import { serverEnv } from "@/core/env/server";
import { hasRequiredRole, isUserRole, type UserRole } from "@/core/auth/roles";
import { getAdminAuth, isAdminAvailable } from "@/lib/firebase/admin";

/**
 * @brief Doğrulanmış oturum çerezinden çıkarılan kullanıcı bilgilerini temsil eder.
 */
export interface SessionUser {
  uid: string;
  email?: string;
  role: UserRole | null;
}

/**
 * @brief Mevcut HTTP isteğinden oturum bilgisini okur ve doğrular.
 * @returns Oturum geçerliyse SessionUser, çerez yoksa veya doğrulama başarısızsa null.
 */
export async function getCurrentSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(serverEnv.SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie || !isAdminAvailable()) {
    return null;
  }

  try {
    const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    const role = isUserRole(decoded.role) ? decoded.role : null;

    return {
      uid: decoded.uid,
      email: decoded.email,
      role,
    } satisfies SessionUser;
  } catch {
    return null;
  }
}

/**
 * @brief Geçerli bir oturum gerektirir; yoksa veya yetkisizse AppError fırlatır.
 * @param allowedRoles Belirtilirse kullanıcının bu rollerden birine sahip olması zorunludur.
 * @returns Doğrulanmış SessionUser nesnesi.
 * @throws UNAUTHENTICATED (401) oturum bulunamazsa; FORBIDDEN (403) rol yetersizse.
 */
export async function requireSession(allowedRoles?: readonly UserRole[]) {
  const session = await getCurrentSession();

  if (!session) {
    throw new AppError({
      message: "Authentication required",
      statusCode: 401,
      code: "UNAUTHENTICATED",
    });
  }

  if (allowedRoles && !hasRequiredRole(session.role, allowedRoles)) {
    throw new AppError({
      message: "You do not have permission to perform this action",
      statusCode: 403,
      code: "FORBIDDEN",
    });
  }

  return session;
}
