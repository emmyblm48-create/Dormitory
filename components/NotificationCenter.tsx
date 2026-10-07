"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Wrench, Banknote, Megaphone, ClipboardList, type LucideIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ensurePushHealthy } from "@/lib/push";

export type NotificationType = "status" | "cost" | "announcement" | "new_request";

export interface AppNotification {
  id: number;
  recipient_email: string;
  type: NotificationType;
  title: string;
  body: string;
  url: string | null;
  is_read: boolean;
  created_at: string;
}

export const NOTIFICATION_ICONS: Record<NotificationType, { icon: LucideIcon; color: string }> = {
  status: { icon: Wrench, color: "from-brand-400 to-brand-600" },
  cost: { icon: Banknote, color: "from-amber-400 to-amber-600" },
  announcement: { icon: Megaphone, color: "from-emerald-400 to-emerald-600" },
  new_request: { icon: ClipboardList, color: "from-red-400 to-red-600" },
};

interface Banner {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  url: string | null;
}

interface NotificationContextValue {
  unreadCount: number;
  refreshUnread: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue>({ unreadCount: 0, refreshUnread: async () => {} });
export const useNotifications = () => useContext(NotificationContext);

const BANNER_MS = 5000;

// Live notifications for the logged-in account: keeps the unread badge current, and shows an
// iOS-style banner when a new notification arrives (via Realtime, or via the service worker
// when a push lands while the app is focused).
export function NotificationProvider({ email, children }: { email: string; children: React.ReactNode }) {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [bannerVisible, setBannerVisible] = useState(false);
  const shownIds = useRef(new Set<number>());
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const recipient = email.toLowerCase();

  const refreshUnread = useCallback(async () => {
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false);
    setUnreadCount(count ?? 0);
  }, []);

  const showBanner = useCallback((b: Banner) => {
    // Realtime and the service worker can both deliver the same row; show it once
    if (shownIds.current.has(b.id)) return;
    shownIds.current.add(b.id);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setBanner(b);
    requestAnimationFrame(() => setBannerVisible(true));
    hideTimer.current = setTimeout(() => setBannerVisible(false), BANNER_MS);
  }, []);

  useEffect(() => {
    refreshUnread();
    ensurePushHealthy().catch(() => {});

    const channel = supabase
      .channel(`notifications-${recipient}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `recipient_email=eq.${recipient}` },
        (payload) => {
          refreshUnread();
          if (payload.eventType === "INSERT") {
            const row = payload.new as AppNotification;
            showBanner({ id: row.id, type: row.type, title: row.title, body: row.body, url: row.url });
          }
        }
      )
      .subscribe();

    const onMessage = (event: MessageEvent) => {
      const msg = event.data;
      if (msg?.type !== "dormitory-push" || !msg.payload) return;
      const p = msg.payload;
      refreshUnread();
      showBanner({ id: p.id, type: p.type ?? "status", title: p.title, body: p.body, url: p.url ?? null });
    };
    navigator.serviceWorker?.addEventListener("message", onMessage);

    return () => {
      supabase.removeChannel(channel);
      navigator.serviceWorker?.removeEventListener("message", onMessage);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [recipient, refreshUnread, showBanner]);

  const BannerIcon = banner ? NOTIFICATION_ICONS[banner.type]?.icon ?? Bell : Bell;

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshUnread }}>
      {children}
      {banner && (
        <button
          type="button"
          onClick={() => {
            setBannerVisible(false);
            if (banner.url) router.push(banner.url);
          }}
          className="fixed left-1/2 z-[60] w-[min(92vw,380px)] text-left flex items-start gap-2.5 rounded-2xl bg-white/90 backdrop-blur-xl shadow-glass-lg border border-white/70 px-3.5 py-3"
          style={{
            top: "calc(env(safe-area-inset-top, 0px) + 10px)",
            transform: `translate(-50%, ${bannerVisible ? "0" : "-150%"})`,
            opacity: bannerVisible ? 1 : 0,
            transition: "transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s",
            pointerEvents: bannerVisible ? "auto" : "none",
          }}
        >
          <span
            className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-white bg-gradient-to-br ${
              NOTIFICATION_ICONS[banner.type]?.color ?? "from-brand-400 to-brand-600"
            }`}
          >
            <BannerIcon size={18} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-bold text-slate-900 truncate">{banner.title}</span>
              <span className="text-[10px] text-slate-400 shrink-0">ตอนนี้</span>
            </span>
            <span className="block text-xs text-slate-600 line-clamp-2">{banner.body}</span>
          </span>
        </button>
      )}
    </NotificationContext.Provider>
  );
}

// Header bell with an unread badge, linking to the role's notifications page
export function NotificationBell({ href }: { href: string }) {
  const { unreadCount } = useNotifications();
  return (
    <Link
      href={href}
      title="การแจ้งเตือน"
      className="tap relative flex items-center justify-center w-10 h-10 rounded-full text-slate-800 hover:bg-slate-100 transition-colors"
    >
      <Bell size={22} />
      {unreadCount > 0 && (
        <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
