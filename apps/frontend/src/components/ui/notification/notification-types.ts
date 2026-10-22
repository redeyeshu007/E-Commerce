export type NotificationType = "success" | "error" | "warning" | "info";

export interface NotificationAction {
  label: string;
  onClick?: () => void;
  href?: string;
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  message: string;
  description?: string;
  duration?: number;
  action?: NotificationAction;
  createdAt: number;
}

export interface NotifyOptions {
  description?: string;
  duration?: number;
  action?: NotificationAction;
}

export interface NotifyApi {
  success: (message: string, options?: NotifyOptions) => string;
  error: (message: string, options?: NotifyOptions) => string;
  warning: (message: string, options?: NotifyOptions) => string;
  info: (message: string, options?: NotifyOptions) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}
