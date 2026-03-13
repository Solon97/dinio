"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { Notification } from "@/app/api/notifications/domain/entities/Notification";
import apiClient from "@/libs/api";
import { formatRelativeTime } from "@/libs/notifications/formatRelativeTime";

interface NotificationListResponse {
  notifications: Notification[];
  unreadCount: number;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const result: NotificationListResponse =
        await apiClient.get("/notifications");
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
    } catch {
      // silent fail — notifications are non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiClient.patch(`/notifications/${id}`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silent fail
    }
  };

  const handleToggle = () => {
    setOpen((prev) => !prev);
    if (!open) fetchNotifications();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-teal-600 transition-colors"
        title="Notificações"
        aria-label="Notificações"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-teal-500 text-white text-[10px] font-bold leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="font-semibold text-sm text-slate-700">
              Notificações
            </span>
            {unreadCount > 0 && (
              <span className="text-xs text-teal-600 font-medium">
                {unreadCount} não lida{unreadCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <span className="loading loading-spinner loading-sm text-teal-500" />
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                <Bell size={28} className="opacity-30" />
                <span className="text-sm">Nenhuma notificação</span>
              </div>
            )}

            {!loading &&
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex gap-3 px-4 py-3 border-b border-slate-50 cursor-pointer transition-colors ${
                    notif.read
                      ? "bg-white hover:bg-slate-50"
                      : "bg-teal-50 hover:bg-teal-100/60"
                  }`}
                  onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${
                        notif.read ? "text-slate-600" : "text-slate-800"
                      }`}
                    >
                      {notif.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 whitespace-pre-wrap">
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {formatRelativeTime(notif.createdAt)}
                    </p>
                  </div>
                  {!notif.read && (
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-teal-500 mt-1.5" />
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
