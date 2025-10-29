// src/components/custom/notifications.tsx
"use client";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";

// Custom types for notifications
type Notification = {
  id: number;
  user: string;
  action: string;
  target: string;
  timestamp: string;
  unread: boolean;
};

function Dot({ className }: { className?: string }) {
  return (
    <svg
      width="6"
      height="6"
      fill="currentColor"
      viewBox="0 0 6 6"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="3" cy="3" r="3" />
    </svg>
  );
}

// The component now only renders the list, not the popover wrapper
export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      user: "Front Desk",
      action: "reported",
      target: "Room 203 needs cleaning",
      timestamp: "15 minutes ago",
      unread: true,
    },
    {
      id: 2,
      user: "Housekeeping",
      action: "completed",
      target: "Room 305 cleaning",
      timestamp: "45 minutes ago",
      unread: true,
    },
    {
      id: 3,
      user: "Reservation System",
      action: "assigned you",
      target: "New booking for Suite 401",
      timestamp: "2 hours ago",
      unread: false,
    },
    {
      id: 4,
      user: "Maintenance",
      action: "updated status for",
      target: "AC repair in Room 102",
      timestamp: "5 hours ago",
      unread: false,
    },
    {
      id: 5,
      user: "Billing",
      action: "processed payment for",
      target: "Guest John Smith",
      timestamp: "1 day ago",
      unread: false,
    },
  ]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleMarkAllAsRead = () => {
    setNotifications(
      notifications.map((notification) => ({
        ...notification,
        unread: false,
      }))
    );
  };

  const handleNotificationClick = (id: number) => {
    setNotifications(
      notifications.map((notification) =>
        notification.id === id
          ? { ...notification, unread: false }
          : notification
      )
    );
  };

  return (
    <>
      <div className="flex items-baseline rounded-2xl justify-between gap-4 px-4 py-3">
        <h3 className="text-sm font-semibold dark:text-[#D0D5DD]">
          Notifications
        </h3>
        {unreadCount > 0 && (
          <button
            className="text-xs font-medium text-primary hover:underline dark:text-[#0785CF]"
            onClick={handleMarkAllAsRead}
          >
            Mark all as read
          </button>
        )}
      </div>
      <Separator className="dark:bg-[#1D2939]" />
      <div className="max-h-[400px]  overflow-y-auto">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className="hover:bg-accent transition-colors dark:hover:bg-[#1C2433]"
            >
              <div className="relative flex items-start px-4 py-3">
                <div className="flex-1 space-y-1">
                  <button
                    className="text-left w-full after:absolute after:inset-0"
                    onClick={() => handleNotificationClick(notification.id)}
                  >
                    <p className="text-sm dark:text-[#D0D5DD]">
                      <span className="font-medium">{notification.user}</span>{" "}
                      {notification.action}{" "}
                      <span className="font-medium">{notification.target}</span>
                    </p>
                    <p className="text-muted-foreground text-xs dark:text-[#98A2B3]">
                      {notification.timestamp}
                    </p>
                  </button>
                </div>
                {notification.unread && (
                  <div className="absolute right-4 top-4">
                    <span className="sr-only">Unread</span>
                    <Dot className="text-primary dark:text-[#0785CF]" />
                  </div>
                )}
              </div>
              <Separator className="dark:bg-[#1D2939]" />
            </div>
          ))
        ) : (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground dark:text-[#98A2B3]">
            No notifications
          </div>
        )}
      </div>
    </>
  );
}
