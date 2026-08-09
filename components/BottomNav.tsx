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
    <nav className="shrink-0 bg-white border-t border-slate-200 flex justify-around items-stretch shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium transition-colors ${
              active ? "text-[#3182F6]" : "text-slate-400"
            }`}
          >
            <Icon size={22} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
