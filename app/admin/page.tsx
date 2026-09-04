"use client";

import { useEffect, useMemo, useState } from "react";
import { DoorOpen, Package, Wrench, Users, Banknote } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/format";
import type { RepairCostStat } from "@/lib/types";

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

interface MonthlyStat {
  report_year: number;
  report_month: number;
  total_repairs: number;
}

const MONTH_LABELS = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats>({ rooms: 0, products: 0, pendingRequests: 0, tenants: 0 });
  const [topRepairs, setTopRepairs] = useState<RepairStat[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStat[]>([]);
  const [costStats, setCostStats] = useState<RepairCostStat[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [rooms, products, pending, tenants, repairStats, monthly, cost] = await Promise.all([
        supabase.from("rooms").select("*", { count: "exact", head: true }),
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("maintenance_request").select("*", { count: "exact", head: true }).eq("status", "สถานะแจ้งซ่อม"),
        supabase.from("user_extra").select("*", { count: "exact", head: true }).eq("role", "user"),
        supabase.from("view_repair_stats").select("*").order("total_repairs", { ascending: false }).limit(5),
        supabase.from("view_repair_monthly_stats").select("*"),
        supabase.from("view_repair_cost_stats").select("*"),
      ]);
      setStats({
        rooms: rooms.count ?? 0,
        products: products.count ?? 0,
        pendingRequests: pending.count ?? 0,
        tenants: tenants.count ?? 0,
      });
      if (repairStats.data) setTopRepairs(repairStats.data as RepairStat[]);
      if (monthly.data) {
        const data = monthly.data as MonthlyStat[];
        setMonthlyStats(data);
        if (data.length > 0) setSelectedYear(Math.max(...data.map((d) => d.report_year)));
      }
      if (cost.data) setCostStats(cost.data as RepairCostStat[]);
      setIsLoading(false);
    })();
  }, []);

  const totalRepairCost = useMemo(() => costStats.reduce((sum, c) => sum + Number(c.total_cost), 0), [costStats]);
  const maxCost = Math.max(1, ...costStats.map((c) => Number(c.total_cost)));

  const availableYears = useMemo(() => {
    const years = Array.from(new Set(monthlyStats.map((d) => d.report_year))).sort((a, b) => b - a);
    return years.length > 0 ? years : [new Date().getFullYear()];
  }, [monthlyStats]);

  const yearData = useMemo(() => {
    const byMonth = new Map(
      monthlyStats.filter((d) => d.report_year === selectedYear).map((d) => [d.report_month, d.total_repairs])
    );
    return MONTH_LABELS.map((label, i) => ({ label, total: byMonth.get(i + 1) ?? 0 }));
  }, [monthlyStats, selectedYear]);

  const maxMonthly = Math.max(1, ...yearData.map((d) => d.total));

  const cards = [
    { label: "ห้องพักทั้งหมด", value: stats.rooms, icon: DoorOpen, color: "from-brand-500 to-brand-700" },
    { label: "ครุภัณฑ์ทั้งหมด", value: stats.products, icon: Package, color: "from-emerald-400 to-emerald-600" },
    { label: "รอดำเนินการซ่อม", value: stats.pendingRequests, icon: Wrench, color: "from-red-400 to-red-600" },
    { label: "ผู้เช่าทั้งหมด", value: stats.tenants, icon: Users, color: "from-amber-400 to-amber-600" },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full">
      <h2 className="text-lg md:text-xl font-bold text-slate-900">ภาพรวมระบบ</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card rounded-2xl p-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 text-white bg-gradient-to-br ${color} shadow-glass-sm`}>
              <Icon size={20} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{isLoading ? "-" : value}</p>
            <p className="text-xs text-slate-400 font-medium">{label}</p>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-4 flex items-center gap-4 bg-gradient-to-r from-amber-50/80 to-white/50">
        <div className="w-12 h-12 shrink-0 rounded-xl flex items-center justify-center text-white bg-gradient-to-br from-amber-400 to-amber-600 shadow-glass-sm">
          <Banknote size={22} />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900">{isLoading ? "-" : formatCurrency(totalRepairCost)}</p>
          <p className="text-xs text-slate-500 font-medium">ค่าใช้จ่ายในการซ่อมทั้งหมด</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-4">
        <h3 className="text-sm font-bold text-slate-900 mb-4">ค่าใช้จ่ายซ่อมแยกตามครุภัณฑ์</h3>
        {isLoading ? (
          <div className="text-center py-6 text-slate-400 text-xs">กำลังโหลดข้อมูล...</div>
        ) : costStats.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">ยังไม่มีการบันทึกค่าใช้จ่ายซ่อม</div>
        ) : (
          <div className="flex items-end gap-3 h-40 overflow-x-auto">
            {costStats.map((c) => (
              <div key={c.product_name} className="flex flex-col items-center justify-end gap-1.5 h-full shrink-0 w-16">
                <span className="text-[10px] font-semibold text-slate-500 whitespace-nowrap">
                  {formatCurrency(c.total_cost)}
                </span>
                <div
                  className="w-full max-w-[28px] bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-md transition-all"
                  style={{ height: `${Math.max(4, (Number(c.total_cost) / maxCost) * 100)}%` }}
                  title={`${c.product_name}: ${formatCurrency(c.total_cost)}`}
                />
                <span className="text-[10px] text-slate-400 text-center leading-tight line-clamp-2">
                  {c.product_name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900">สถิติการแจ้งซ่อมรายเดือน</h3>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="glass-input px-2.5 py-1.5 rounded-lg text-xs"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                ปี {y + 543}
              </option>
            ))}
          </select>
        </div>
        {isLoading ? (
          <div className="text-center py-6 text-slate-400 text-xs">กำลังโหลดข้อมูล...</div>
        ) : yearData.every((d) => d.total === 0) ? (
          <div className="text-center py-6 text-slate-400 text-xs">ยังไม่มีข้อมูลในปีนี้</div>
        ) : (
          <div className="flex items-end justify-between gap-1.5 h-40">
            {yearData.map((d) => (
              <div key={d.label} className="flex-1 flex flex-col items-center justify-end gap-1.5 h-full">
                <span className="text-[10px] font-semibold text-slate-500">{d.total > 0 ? d.total : ""}</span>
                <div
                  className="w-full max-w-[22px] bg-gradient-to-t from-brand-600 to-brand-400 rounded-t-md transition-all"
                  style={{ height: `${Math.max(4, (d.total / maxMonthly) * 100)}%` }}
                  title={`${d.label}: ${d.total} ครั้ง`}
                />
                <span className="text-[10px] text-slate-400">{d.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-3">ครุภัณฑ์ที่แจ้งซ่อมบ่อยที่สุด</h3>
        {topRepairs.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs glass-card rounded-2xl">
            ยังไม่มีข้อมูล
          </div>
        ) : (
          <div className="glass-card rounded-2xl divide-y divide-white/50">
            {topRepairs.map((r) => (
              <div key={r.product_name} className="p-3.5 flex items-center justify-between">
                <span className="text-sm text-slate-800 font-medium">{r.product_name}</span>
                <span className="text-xs bg-red-100/80 text-red-600 px-2.5 py-1 rounded-full font-semibold">
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
