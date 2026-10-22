"use client";

import React from "react";
import type { NotificationItem } from "./notification-types";
import { NotificationPopupItem } from "./notification-item";

interface NotificationContainerProps {
  notifications: NotificationItem[];
  onDismiss: (id: string) => void;
}

export function NotificationContainer({
  notifications,
  onDismiss,
}: NotificationContainerProps) {
  if (notifications.length === 0) return null;

  return (
    <aside
      aria-label="Notifications"
      className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:top-6 z-[9999] pointer-events-none flex flex-col gap-2.5 max-w-sm w-full"
    >
      {notifications.map((notification) => (
        <NotificationPopupItem
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </aside>
  );
}
