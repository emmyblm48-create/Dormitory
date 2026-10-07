"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNotifications } from "@/components/NotificationCenter";
import { isTabActive, type TabItem } from "@/components/app/routes";

// Mobile bottom tab bar in the BLM48 style: a frosted bar with rounded top corners, where the
// active tab's icon springs up out of the bar into a filled circle.
export function TabBar({ tabs, avatarText }: { tabs: TabItem[]; avatarText?: string }) {
  const pathname = usePathname();
  const { unreadCount } = useNotifications();

  return (
    <nav className="md:hidden fixed inset-x-0 bottom-0 z-30">
      <div
        className="bg-white/85 backdrop-blur-2xl border-t border-white/70 rounded-t-[28px] shadow-[0_-12px_35px_rgba(4,44,98,0.10)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="h-16 flex items-stretch justify-around px-1">
          {tabs.map((tab) => {
            const active = isTabActive(tab, pathname);
            const Icon = tab.icon;
            const showBadge = tab.badge === "notifications" && unreadCount > 0;
            return (
              <Link key={tab.href} href={tab.href} className="tap relative flex-1 flex flex-col items-center justify-end pb-2">
                <span
                  className={`relative flex items-center justify-center rounded-full transition-all duration-300 ${
                    active
                      ? "w-[52px] h-[52px] -translate-y-3 bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-bloom ring-4 ring-white"
                      : "w-8 h-8 text-slate-400"
                  }`}
                  style={{ transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 1.275)" }}
                >
                  {Icon === "avatar" ? (
                    <span
                      className={`flex items-center justify-center rounded-full font-bold leading-none ${
                        active ? "w-full h-full text-[13px]" : "w-7 h-7 text-[10px] bg-slate-200 text-slate-600"
                      }`}
                    >
                      {avatarText ?? "?"}
                    </span>
                  ) : (
                    <Icon size={active ? 24 : 22} strokeWidth={active ? 2.2 : 2} />
                  )}
                  {showBadge && (
                    <span className="absolute -top-0.5 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </span>
                <span
                  className={`text-[10px] leading-none transition-all duration-300 ${
                    active ? "-translate-y-1.5 font-bold text-brand-600" : "mt-1 font-medium text-slate-400"
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
