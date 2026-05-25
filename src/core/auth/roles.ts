export const USER_ROLES = ["admin", "dispatcher"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && USER_ROLES.includes(value as UserRole);
}

export function hasRequiredRole(
  role: UserRole | null | undefined,
  allowedRoles: readonly UserRole[],
) {
  return role ? allowedRoles.includes(role) : false;
}
