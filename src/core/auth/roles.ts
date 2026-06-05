export const USER_ROLES = ["admin", "dispatcher"] as const;

export type UserRole = (typeof USER_ROLES)[number];

/**
 * @brief Verilen değerin geçerli bir UserRole olup olmadığını kontrol eden type guard.
 * @param value Kontrol edilecek bilinmeyen değer.
 * @returns Değer "admin" veya "dispatcher" ise true.
 */
export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && USER_ROLES.includes(value as UserRole);
}

/**
 * @brief Kullanıcı rolünün izin verilen roller listesinde olup olmadığını doğrular.
 * @param role Kullanıcının mevcut rolü. null veya undefined ise false döner.
 * @param allowedRoles Erişime izin verilen roller listesi.
 * @returns Kullanıcı rolü izin verilenler arasındaysa true, aksi halde false.
 */
export function hasRequiredRole(
  role: UserRole | null | undefined,
  allowedRoles: readonly UserRole[],
) {
  return role ? allowedRoles.includes(role) : false;
}
