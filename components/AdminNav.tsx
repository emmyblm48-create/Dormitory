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
  Receipt,
} from "lucide-react";

const items = [
  { href: "/admin", label: "ภาพรวม", icon: LayoutDashboard },
  { href: "/admin/rooms", label: "ห้องพัก", icon: DoorOpen },
  { href: "/admin/categories", label: "หมวดหมู่", icon: Tags },
  { href: "/admin/statuses", label: "สถานะ", icon: ListChecks },
  { href: "/admin/products", label: "ครุภัณฑ์", icon: Package },
  { href: "/admin/requests", label: "แจ้งซ่อม", icon: Wrench },
  { href: "/admin/billing", label: "ค่าห้อง", icon: Receipt },
  { href: "/admin/tenants", label: "ผู้เช่า", icon: Users },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden md:flex md:order-first md:flex-col md:w-56 md:shrink-0 md:overflow-y-auto border-r border-slate-200 bg-white py-4 gap-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`mx-3 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active ? "bg-blue-50 text-[#3182F6]" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Mobile bottom nav */}
      <nav className="md:hidden shrink-0 bg-white border-t border-slate-200 flex overflow-x-auto shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 min-w-[64px] flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                active ? "text-[#3182F6]" : "text-slate-400"
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
