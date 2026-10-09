/**
 * Navigation types — frontend only.
 * Define navigation item shapes here as the UI is built.
 */

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  children?: NavItem[];
  requiresAuth?: boolean;
  adminOnly?: boolean;
}
