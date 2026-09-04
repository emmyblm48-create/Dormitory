"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, AlertCircle, ClipboardList, Megaphone } from "lucide-react";

const items = [
  { href: "/user", label: "หน้าหลัก", icon: Home },
  { href: "/user/report", label: "แจ้งซ่อม", icon: AlertCircle },
  { href: "/user/requests", label: "ประวัติ", icon: ClipboardList },
  { href: "/user/announcements", label: "ข่าวสาร", icon: Megaphone },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Tablet+desktop rail: icon-only at md, icon+label at lg */}
      <nav className="hidden md:flex md:flex-col md:w-16 lg:w-56 md:shrink-0 md:sticky md:top-0 md:h-dvh md:overflow-y-auto glass-nav border-r-2 border-dashed border-brand-200 py-5 gap-1 px-2 lg:px-3 md:order-first">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
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

      {/* Mobile floating dock */}
      <nav className="md:hidden fixed bottom-3 left-3 right-3 z-30 flex justify-around items-stretch bg-cream-50/95 backdrop-blur-md border border-brand-100 rounded-2xl shadow-paper px-1 py-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl text-[10px] font-medium transition-colors ${
                active ? "bg-brand-50 text-brand-600" : "text-slate-400"
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
