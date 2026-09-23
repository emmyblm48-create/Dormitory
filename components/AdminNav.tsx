"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Tags,
  ListChecks,
  Package,
  Wrench,
  Users,
  Megaphone,
} from "lucide-react";

const items = [
  { href: "/admin", label: "ภาพรวม", icon: LayoutDashboard },
  { href: "/admin/categories", label: "หมวดหมู่", icon: Tags },
  { href: "/admin/statuses", label: "สถานะ", icon: ListChecks },
  { href: "/admin/products", label: "ครุภัณฑ์", icon: Package },
  { href: "/admin/requests", label: "แจ้งซ่อม", icon: Wrench },
  { href: "/admin/tenants", label: "ผู้เช่า/ห้องพัก", icon: Users },
  { href: "/admin/announcements", label: "ข่าวสาร", icon: Megaphone },
];

export function AdminNav() {
  const pathname = usePathname();
  const activeRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [pathname]);

  return (
    <>
      {/* Tablet+desktop rail: icon-only at md, icon+label at lg */}
      <nav className="hidden md:flex md:flex-col md:w-16 lg:w-56 md:shrink-0 md:sticky md:top-0 md:h-dvh md:overflow-y-auto glass-nav border-r-2 border-dashed border-brand-200 py-5 gap-1 px-2 lg:px-3">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all justify-center lg:justify-start ${
                active
                  ? "bg-gradient-to-r from-bloom-500 to-brand-600 text-white shadow-lg shadow-brand-600/25"
                  : "text-slate-500 hover:bg-white/70"
              }`}
            >
              <Icon size={18} className="shrink-0" />
              <span className="hidden lg:inline">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile floating dock: swipeable slider, since all sections don't fit at once */}
      <nav className="md:hidden fixed bottom-3 left-3 right-3 z-30 bg-cream-50/95 backdrop-blur-md border border-brand-100 rounded-2xl shadow-paper">
        <div className="relative">
          <div className="flex items-stretch gap-1 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth px-2 py-1">
            {items.map(({ href, label, icon: Icon }) => {
              const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  ref={active ? activeRef : undefined}
                  className={`w-[68px] shrink-0 snap-center flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl text-[10px] font-medium transition-colors ${
                    active ? "bg-brand-50 text-brand-600" : "text-slate-400"
                  }`}
                >
                  <Icon size={19} />
                  {label}
                </Link>
              );
            })}
          </div>
          <div className="absolute inset-y-0 left-0 w-4 rounded-l-2xl bg-gradient-to-r from-cream-50 to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-4 rounded-r-2xl bg-gradient-to-l from-cream-50 to-transparent pointer-events-none" />
        </div>
      </nav>
    </>
  );
}
