"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardCheck, AlertCircle, Receipt, ClipboardList, type LucideIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

interface MenuTile {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  badge?: number;
}

export default function UserHomePage() {
  const { profile } = useAuth();
  const [pendingRepairs, setPendingRepairs] = useState(0);
  const [unpaidBills, setUnpaidBills] = useState(0);

  useEffect(() => {
    (async () => {
      const [repairs, bills] = await Promise.all([
        supabase
          .from("maintenance_request")
          .select("*", { count: "exact", head: true })
          .neq("status", "สถานะเสร็จสมบรูณ์"),
        supabase.from("view_room_bills").select("*", { count: "exact", head: true }).neq("status", "paid"),
      ]);
      setPendingRepairs(repairs.count ?? 0);
      setUnpaidBills(bills.count ?? 0);
    })();
  }, []);

  const tiles: MenuTile[] = [
    {
      href: "/user/checklist",
      label: "เช็คอุปกรณ์",
      description: "ตรวจครุภัณฑ์ในห้อง",
      icon: ClipboardCheck,
      color: "from-brand-500 to-brand-700",
    },
    {
      href: "/user/report",
      label: "แจ้งซ่อม",
      description: "แจ้งครุภัณฑ์เสียหาย",
      icon: AlertCircle,
      color: "from-red-400 to-red-600",
    },
    {
      href: "/user/billing",
      label: "ค่าห้อง",
      description: "ชำระค่าห้องพัก",
      icon: Receipt,
      color: "from-amber-400 to-amber-600",
      badge: unpaidBills,
    },
    {
      href: "/user/requests",
      label: "ประวัติ",
      description: "ประวัติการแจ้งซ่อม",
      icon: ClipboardList,
      color: "from-emerald-400 to-emerald-600",
      badge: pendingRepairs,
    },
  ];

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto w-full">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-900">สวัสดี ห้อง {profile?.userName}</h3>
        <p className="text-sm text-slate-400">เลือกเมนูที่ต้องการใช้งาน</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {tiles.map(({ href, label, description, icon: Icon, color, badge }) => (
          <Link
            key={href}
            href={href}
            className="relative glass-card rounded-2xl p-5 flex flex-col items-center text-center gap-2.5 hover:bg-white/85 hover:-translate-y-0.5 transition-all"
          >
            {!!badge && (
              <span className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center shadow">
                {badge}
              </span>
            )}
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br ${color} shadow-lg`}>
              <Icon size={30} />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">{label}</p>
              <p className="text-[11px] text-slate-400">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
