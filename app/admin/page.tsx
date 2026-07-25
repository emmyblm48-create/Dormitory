"use client";

import { useEffect, useState } from "react";
import { DoorOpen, Package, Wrench, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Stats {
  rooms: number;
  products: number;
  pendingRequests: number;
  tenants: number;
}

interface RepairStat {
  product_name: string;
  total_repairs: number;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats>({ rooms: 0, products: 0, pendingRequests: 0, tenants: 0 });
  const [topRepairs, setTopRepairs] = useState<RepairStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [rooms, products, pending, tenants, repairStats] = await Promise.all([
        supabase.from("rooms").select("*", { count: "exact", head: true }),
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("maintenance_request").select("*", { count: "exact", head: true }).eq("status", "สถานะแจ้งซ่อม"),
        supabase.from("user_extra").select("*", { count: "exact", head: true }).eq("role", "user"),
        supabase.from("view_repair_stats").select("*").order("total_repairs", { ascending: false }).limit(5),
      ]);
      setStats({
        rooms: rooms.count ?? 0,
        products: products.count ?? 0,
        pendingRequests: pending.count ?? 0,
        tenants: tenants.count ?? 0,
      });
      if (repairStats.data) setTopRepairs(repairStats.data as RepairStat[]);
      setIsLoading(false);
    })();
  }, []);

  const cards = [
    { label: "ห้องพักทั้งหมด", value: stats.rooms, icon: DoorOpen, color: "bg-blue-50 text-[#0B57D0]" },
    { label: "ครุภัณฑ์ทั้งหมด", value: stats.products, icon: Package, color: "bg-emerald-50 text-emerald-600" },
    { label: "รอดำเนินการซ่อม", value: stats.pendingRequests, icon: Wrench, color: "bg-red-50 text-red-500" },
    { label: "ผู้เช่าทั้งหมด", value: stats.tenants, icon: Users, color: "bg-amber-50 text-amber-600" },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full">
      <h2 className="text-lg md:text-xl font-bold text-slate-900">ภาพรวมระบบ</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon size={20} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{isLoading ? "-" : value}</p>
            <p className="text-xs text-slate-400 font-medium">{label}</p>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-3">ครุภัณฑ์ที่แจ้งซ่อมบ่อยที่สุด</h3>
        {topRepairs.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs bg-white rounded-2xl border border-slate-100">
            ยังไม่มีข้อมูล
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100">
            {topRepairs.map((r) => (
              <div key={r.product_name} className="p-3.5 flex items-center justify-between">
                <span className="text-sm text-slate-800 font-medium">{r.product_name}</span>
                <span className="text-xs bg-red-100 text-red-600 px-2.5 py-1 rounded-full font-semibold">
                  {r.total_repairs} ครั้ง
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
