"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatFullDate, formatCurrency } from "@/lib/format";
import { MONTH_LABELS } from "@/lib/dashboard";
import { AssetAvatar } from "@/components/AssetAvatar";
import type { ViewHomeUser } from "@/lib/types";

const STATUS_DONE = "สถานะเสร็จสมบรูณ์";

// Completed repairs for the tenant's room (RLS on view_home_user scopes rows to their room),
// grouped by the month they were reported.
export default function CompletedRequestsPage() {
  const [requests, setRequests] = useState<ViewHomeUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [year, setYear] = useState<number | "all">("all");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("view_home_user")
        .select("*")
        .eq("status", STATUS_DONE)
        .order("reported_date", { ascending: false });
      if (data) setRequests(data as ViewHomeUser[]);
      setIsLoading(false);
    })();
  }, []);

  const years = useMemo(
    () =>
      Array.from(new Set(requests.filter((r) => r.reported_date).map((r) => new Date(r.reported_date!).getFullYear()))).sort(
        (a, b) => b - a
      ),
    [requests]
  );

  const visible = year === "all" ? requests : requests.filter((r) => r.reported_date && new Date(r.reported_date).getFullYear() === year);

  const groups = useMemo(() => {
    const map = new Map<string, { label: string; items: ViewHomeUser[]; cost: number }>();
    for (const r of visible) {
      const d = r.reported_date ? new Date(r.reported_date) : null;
      const key = d ? `${d.getFullYear()}-${d.getMonth()}` : "unknown";
      const label = d ? `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear() + 543}` : "ไม่ระบุวันที่";
      const group = map.get(key) ?? { label, items: [], cost: 0 };
      group.items.push(r);
      group.cost += Number(r.repair_cost ?? 0);
      map.set(key, group);
    }
    return Array.from(map.values());
  }, [visible]);

  const totalCost = visible.reduce((s, r) => s + Number(r.repair_cost ?? 0), 0);

  return (
    <div className="p-4 md:p-8 space-y-4 max-w-3xl mx-auto w-full">
      <h3 className="sr-only">ประวัติการซ่อมที่เสร็จสมบูรณ์</h3>

      <div className="glass-card rounded-2xl grid grid-cols-2 divide-x divide-brand-100 text-center">
        <div className="py-3.5">
          <p className="text-lg font-bold text-slate-900 tabular-nums">{isLoading ? "-" : visible.length}</p>
          <p className="text-[11px] text-slate-500">ซ่อมเสร็จแล้ว (รายการ)</p>
        </div>
        <div className="py-3.5">
          <p className="text-lg font-bold text-emerald-600 tabular-nums">{isLoading ? "-" : formatCurrency(totalCost)}</p>
          <p className="text-[11px] text-slate-500">ค่าซ่อมรวม</p>
        </div>
      </div>

      {years.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar text-xs">
          {(["all", ...years] as const).map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`tap shrink-0 px-3.5 py-1.5 rounded-full font-semibold transition-colors ${
                year === y ? "bg-brand-600 text-white" : "bg-white/80 text-slate-500 border border-brand-100"
              }`}
            >
              {y === "all" ? "ทั้งหมด" : `ปี ${y + 543}`}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-brand-400" size={24} />
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-10 text-slate-400 text-sm glass-card rounded-2xl flex flex-col items-center gap-2">
          <CheckCircle2 size={28} className="text-slate-300" />
          ยังไม่มีรายการที่ซ่อมเสร็จ
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.label} className="space-y-2.5">
            <div className="flex items-baseline justify-between px-1">
              <h4 className="text-sm font-bold text-slate-900">{group.label}</h4>
              <span className="text-[11px] text-slate-500">
                {group.items.length} รายการ{group.cost > 0 && ` · ${formatCurrency(group.cost)}`}
              </span>
            </div>
            {group.items.map((item) => (
              <div key={item.maintenance_request_id} className="glass-card rounded-2xl p-3.5 flex items-center gap-3.5">
                <AssetAvatar imageUrl={item.image_path || item.product_image} name={item.product_name} />
                <div className="flex-1 min-w-0">
                  <h5 className="font-bold text-slate-900 text-base leading-tight truncate">{item.product_name}</h5>
                  {item.description && <p className="text-slate-500 text-xs truncate">{item.description}</p>}
                  <p className="flex items-center gap-1 font-medium text-xs my-0.5 text-emerald-600">
                    <CheckCircle2 size={12} /> ซ่อมเสร็จสมบูรณ์
                  </p>
                  <p className="text-slate-400 text-[10px] md:text-xs">แจ้งเมื่อ {formatFullDate(item.reported_date)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-slate-400">ค่าซ่อม</p>
                  <p className="text-sm font-bold text-slate-900 tabular-nums">
                    {item.repair_cost != null ? formatCurrency(item.repair_cost) : "-"}
                  </p>
                </div>
              </div>
            ))}
          </section>
        ))
      )}
    </div>
  );
}
