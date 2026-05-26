export type PortalType = 'admin' | 'staff' | 'dispatch' | 'billing' | 'stock' | 'all';

export interface PortalConfig {
  type: PortalType;
  label: string;
  subtitle: string;
  role: string | null;
  defaultRedirect: string;
  accentColor: string;
  gradientFrom: string;
  gradientTo: string;
}

const CONFIG: PortalConfig = {
  type: 'billing',
  label: 'Billing Portal',
  subtitle: 'Finance & Invoice Management',
  role: 'billing',
  defaultRedirect: '/billing/dashboard',
  accentColor: '#F59E0B',
  gradientFrom: '#F59E0B',
  gradientTo: '#EF4444',
};

export function getPortalConfig(): PortalConfig {
  return CONFIG;
}

export function isRoleAllowedOnPortal(userRole: string, config: PortalConfig): boolean {
  if (userRole === 'admin') return true;
  return userRole === 'billing';
}

export function getLoginRedirect(userRole: string, config: PortalConfig): string {
  return '/billing/dashboard';
}
