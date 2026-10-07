"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserCircle } from "lucide-react";
import { useNotifications } from "@/components/NotificationCenter";
import { USER_TABS, isTabActive } from "@/components/app/routes";

// Tablet+desktop rail for tenants (icon-only at md, icon+label at lg). On phones the
// TabBar in the user layout takes over.
export function BottomNav() {
  const pathname = usePathname();
  const { unreadCount } = useNotifications();

  return (
    <nav className="hidden md:flex md:flex-col md:w-16 lg:w-56 md:shrink-0 md:sticky md:top-0 md:h-dvh md:overflow-y-auto glass-nav border-r-2 border-dashed border-brand-200 py-5 gap-1 px-2 lg:px-3 md:order-first">
      {USER_TABS.map((tab) => {
        const active = isTabActive(tab, pathname);
        const Icon = tab.icon === "avatar" ? UserCircle : tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            title={tab.label}
            className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all justify-center lg:justify-start ${
              active
                ? "bg-gradient-to-r from-bloom-500 to-brand-600 text-white shadow-lg shadow-brand-600/25"
                : "text-slate-500 hover:bg-white/70"
            }`}
          >
            <Icon size={18} className="shrink-0" />
            <span className="hidden lg:inline">{tab.label}</span>
            {tab.badge === "notifications" && unreadCount > 0 && (
              <span className="absolute top-1.5 left-7 lg:static lg:ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
