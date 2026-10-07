"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Tags,
  Package,
  Wrench,
  Users,
  Megaphone,
  Bell,
  Menu,
} from "lucide-react";
import { useNotifications } from "@/components/NotificationCenter";

const items = [
  { href: "/admin", label: "ภาพรวม", icon: LayoutDashboard },
  { href: "/admin/requests", label: "แจ้งซ่อม", icon: Wrench },
  { href: "/admin/tenants", label: "ผู้เช่า/ห้องพัก", icon: Users },
  { href: "/admin/announcements", label: "ข่าวสาร", icon: Megaphone },
  { href: "/admin/products", label: "ครุภัณฑ์", icon: Package },
  { href: "/admin/categories", label: "หมวดหมู่/สถานะ", icon: Tags },
  { href: "/admin/notifications", label: "การแจ้งเตือน", icon: Bell },
  { href: "/admin/menu", label: "เมนู/ตั้งค่า", icon: Menu },
];

// Tablet+desktop rail for admins (icon-only at md, icon+label at lg). On phones the
// TabBar in the admin layout takes over.
export function AdminNav() {
  const pathname = usePathname();
  const { unreadCount } = useNotifications();

  return (
    <nav className="hidden md:flex md:flex-col md:w-16 lg:w-56 md:shrink-0 md:sticky md:top-0 md:h-dvh md:overflow-y-auto glass-nav border-r-2 border-dashed border-brand-200 py-5 gap-1 px-2 lg:px-3">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === href || pathname.startsWith("/admin/dashboard") : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            title={label}
            className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all justify-center lg:justify-start ${
              active
                ? "bg-gradient-to-r from-bloom-500 to-brand-600 text-white shadow-lg shadow-brand-600/25"
                : "text-slate-500 hover:bg-white/70"
            }`}
          >
            <Icon size={18} className="shrink-0" />
            <span className="hidden lg:inline">{label}</span>
            {href === "/admin/notifications" && unreadCount > 0 && (
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
