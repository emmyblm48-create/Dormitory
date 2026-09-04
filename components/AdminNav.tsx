"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  DoorOpen,
  Tags,
  ListChecks,
  Package,
  Wrench,
  Users,
  Megaphone,
} from "lucide-react";

const items = [
  { href: "/admin", label: "ภาพรวม", icon: LayoutDashboard },
  { href: "/admin/rooms", label: "ห้องพัก", icon: DoorOpen },
  { href: "/admin/categories", label: "หมวดหมู่", icon: Tags },
  { href: "/admin/statuses", label: "สถานะ", icon: ListChecks },
  { href: "/admin/products", label: "ครุภัณฑ์", icon: Package },
  { href: "/admin/requests", label: "แจ้งซ่อม", icon: Wrench },
  { href: "/admin/tenants", label: "ผู้เช่า", icon: Users },
  { href: "/admin/announcements", label: "ข่าวสาร", icon: Megaphone },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden md:flex md:order-first md:flex-col md:w-60 md:shrink-0 md:overflow-y-auto glass-nav border-r py-4 gap-1 px-3">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-600/25"
                  : "text-slate-500 hover:bg-white/60"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Mobile bottom nav */}
      <nav className="md:hidden shrink-0 glass-nav border-t flex overflow-x-auto">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 min-w-[64px] flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                active ? "text-brand-600" : "text-slate-400"
              }`}
            >
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
