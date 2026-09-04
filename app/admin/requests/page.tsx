"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatFullDate, formatCurrency } from "@/lib/format";
import { AssetAvatar } from "@/components/AssetAvatar";
import type { ViewHomeUser, Status } from "@/lib/types";

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<ViewHomeUser[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const load = async () => {
    setIsLoading(true);
    const [reqRes, statusRes] = await Promise.all([
      supabase.from("view_home_user").select("*").order("reported_date", { ascending: false }),
      supabase.from("status").select("*").order("status_id"),
    ]);
    if (reqRes.data) setRequests(reqRes.data as ViewHomeUser[]);
    if (statusRes.data) setStatuses(statusRes.data as Status[]);
    setIsLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: number, status: string) => {
    setUpdatingId(id);
    const { error } = await supabase.from("maintenance_request").update({ status }).eq("maintenance_request_id", id);
    if (!error) {
      setRequests((prev) => prev.map((r) => (r.maintenance_request_id === id ? { ...r, status } : r)));
    }
    setUpdatingId(null);
  };

  const updateCost = async (id: number, repair_cost: number | null) => {
    setUpdatingId(id);
    const { error } = await supabase.from("maintenance_request").update({ repair_cost }).eq("maintenance_request_id", id);
    if (!error) {
      setRequests((prev) => prev.map((r) => (r.maintenance_request_id === id ? { ...r, repair_cost } : r)));
    }
    setUpdatingId(null);
  };

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  return (
    <div className="space-y-4 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg md:text-xl font-bold text-slate-900">รายการแจ้งซ่อมทั้งหมด</h2>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="glass-input px-3 py-1.5 rounded-lg text-xs"
          >
            <option value="all">ทุกสถานะ</option>
            {statuses.map((s) => (
              <option key={s.status_id} value={s.status_name}>
                {s.status_name}
              </option>
            ))}
          </select>
          <button onClick={load} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg" title="รีเฟรช">
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-brand-400" size={24} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm glass-card rounded-2xl">
          ไม่มีรายการแจ้งซ่อม
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div key={item.maintenance_request_id} className="glass-card rounded-2xl p-3.5 flex items-center gap-3.5">
              <AssetAvatar imageUrl={item.image_path || item.product_image} name={item.product_name} />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-900 truncate">{item.product_name}</h4>
                <p className="text-xs text-slate-500">ห้อง {item.room_number}</p>
                {item.description && <p className="text-xs text-slate-500 truncate">{item.description}</p>}
                <p className="text-slate-400 text-[10px] font-mono">{formatFullDate(item.reported_date)}</p>
                {!!item.repair_cost && (
                  <p className="text-xs font-semibold text-emerald-600 mt-0.5">ค่าซ่อม {formatCurrency(item.repair_cost)}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5 shrink-0 items-end">
                <select
                  value={item.status ?? ""}
                  disabled={updatingId === item.maintenance_request_id}
                  onChange={(e) => updateStatus(item.maintenance_request_id, e.target.value)}
                  className="glass-input px-2.5 py-1.5 rounded-lg text-xs"
                >
                  {statuses.map((s) => (
                    <option key={s.status_id} value={s.status_name}>
                      {s.status_name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="ค่าซ่อม (บาท)"
                  defaultValue={item.repair_cost ?? ""}
                  disabled={updatingId === item.maintenance_request_id}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    const cost = v === "" ? null : Number(v);
                    if (cost !== item.repair_cost) updateCost(item.maintenance_request_id, cost);
                  }}
                  className="glass-input px-2.5 py-1.5 rounded-lg text-xs w-32 text-right"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
