"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, AlertCircle, ClipboardList, Receipt } from "lucide-react";

const items = [
  { href: "/user", label: "หน้าหลัก", icon: Home },
  { href: "/user/report", label: "แจ้งซ่อม", icon: AlertCircle },
  { href: "/user/requests", label: "ประวัติ", icon: ClipboardList },
  { href: "/user/billing", label: "ค่าห้อง", icon: Receipt },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="shrink-0 glass-nav border-t flex justify-around items-stretch">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium transition-colors ${
              active ? "text-brand-600" : "text-slate-400"
            }`}
          >
            {active && (
              <span className="absolute top-1 h-1 w-6 rounded-full bg-gradient-to-r from-brand-500 to-brand-600" />
            )}
            <Icon size={22} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
