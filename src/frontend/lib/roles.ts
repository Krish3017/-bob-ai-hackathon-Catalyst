import { UserRole } from "@/types";

export interface RoleConfig {
  role: UserRole;
  label: string;
  description: string;
  defaultDashboard: string;
  allowedRoutes: string[];
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  admin: {
    role: "admin",
    label: "Port Manager (Admin)",
    description: "Full administrative authority: user management, schedule approvals, and system configuration.",
    defaultDashboard: "/",
    allowedRoutes: [
      "/",
      "/operations",
      "/port-twin",
      "/vessels",
      "/berths",
      "/cranes",
      "/yards",
      "/optimization",
      "/disruptions",
      "/copilot",
      "/users",
    ],
  },
  operations: {
    role: "operations",
    label: "Operations Staff",
    description: "Quayside management: live resource tracking, disruption response, and schedule optimization.",
    defaultDashboard: "/operations",
    allowedRoutes: [
      "/operations",
      "/",
      "/port-twin",
      "/vessels",
      "/berths",
      "/cranes",
      "/yards",
      "/optimization",
      "/disruptions",
      "/copilot",
    ],
  },
  viewer: {
    role: "viewer",
    label: "Viewer (Read-Only)",
    description: "Executive and stakeholder access: operational metrics, Gantt schedules, and port twin visualization.",
    defaultDashboard: "/",
    allowedRoutes: [
      "/",
      "/port-twin",
      "/vessels",
      "/berths",
      "/cranes",
      "/yards",
      "/optimization",
      "/disruptions",
      "/copilot",
    ],
  },
};

/**
 * Returns the default dashboard URL for a user's assigned role.
 */
export function getRoleDashboard(role?: UserRole | string | null): string {
  if (!role) return "/";
  const normalized = role.toLowerCase() as UserRole;
  return ROLE_CONFIGS[normalized]?.defaultDashboard || "/";
}

/**
 * Checks if a role is authorized to access a given pathname.
 */
export function isRouteAllowedForRole(role: UserRole | string | null, pathname: string): boolean {
  if (!role) return false;
  const normalized = role.toLowerCase() as UserRole;
  const config = ROLE_CONFIGS[normalized];
  if (!config) return false;

  if (pathname === "/") return config.allowedRoutes.includes("/");

  return config.allowedRoutes.some((route) => {
    if (route === "/") return false;
    return pathname === route || pathname.startsWith(`${route}/`);
  });
}
