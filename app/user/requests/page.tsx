"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronRight, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatFullDate, formatCurrency, statusTextClass } from "@/lib/format";
import { AssetAvatar } from "@/components/AssetAvatar";
import type { ViewHomeUser } from "@/lib/types";

export default function UserRequestsPage() {
  const [requests, setRequests] = useState<ViewHomeUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [completedCount, setCompletedCount] = useState<number | null>(null);

  const load = async () => {
    setIsLoading(true);
    const [{ data, error }, completed] = await Promise.all([
      supabase
        .from("view_home_user")
        .select("*")
        .neq("status", "สถานะเสร็จสมบรูณ์")
        .order("reported_date", { ascending: false }),
      supabase.from("view_home_user").select("*", { count: "exact", head: true }).eq("status", "สถานะเสร็จสมบรูณ์"),
    ]);
    if (!error && data) setRequests(data as ViewHomeUser[]);
    setCompletedCount(completed.count ?? 0);
    setIsLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-4 md:p-8 space-y-4 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <h3 className="sr-only">ประวัติการแจ้งซ่อม</h3>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs bg-red-100/80 backdrop-blur-md text-red-600 px-2.5 py-1 rounded-full font-semibold">
            กำลังดำเนินการ {requests.length} รายการ
          </span>
          <button onClick={load} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg" title="รีเฟรช">
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <Link href="/user/requests/history" className="tap glass-card rounded-2xl p-3.5 flex items-center gap-3">
        <span className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-white bg-gradient-to-br from-emerald-400 to-emerald-600">
          <CheckCircle2 size={20} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-semibold text-slate-900">ประวัติที่ซ่อมเสร็จแล้ว</span>
          <span className="block text-[11px] text-slate-500">ดูรายการซ่อมเสร็จสมบูรณ์ย้อนหลังและค่าซ่อม</span>
        </span>
        {completedCount != null && <span className="text-sm font-bold text-slate-900 tabular-nums">{completedCount}</span>}
        <ChevronRight size={18} className="text-slate-300 shrink-0" />
      </Link>

      {isLoading ? (
        <div className="text-center py-8 text-slate-400 text-xs">กำลังโหลดข้อมูล...</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-xs glass-card rounded-2xl">
          ไม่มีรายการที่กำลังดำเนินการ
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((item) => (
            <div key={item.maintenance_request_id} className="glass-card rounded-2xl p-3.5 flex items-center gap-3.5 hover:bg-white/85 transition-colors">
              <AssetAvatar imageUrl={item.image_path || item.product_image} name={item.product_name} />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-900 text-base md:text-lg leading-tight truncate">
                  {item.product_name}
                </h4>
                {item.description && (
                  <p className="text-slate-500 text-xs truncate">{item.description}</p>
                )}
                <p className={`font-medium text-xs my-0.5 ${statusTextClass(item.status)}`}>
                  {item.status || "สถานะแจ้งซ่อม"}
                </p>
                <p className="text-slate-400 text-[10px] md:text-xs">
                  {formatFullDate(item.reported_date)}
                </p>
                {!!item.repair_cost && (
                  <p className="text-xs font-semibold text-emerald-600 mt-0.5">
                    ค่าซ่อม {formatCurrency(item.repair_cost)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
