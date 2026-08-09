"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatFullDate } from "@/lib/format";
import { AssetAvatar } from "@/components/AssetAvatar";
import type { ViewHomeUser } from "@/lib/types";

export default function UserRequestsPage() {
  const [requests, setRequests] = useState<ViewHomeUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("view_home_user")
      .select("*")
      .order("reported_date", { ascending: false });
    if (!error && data) setRequests(data as ViewHomeUser[]);
    setIsLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-4 md:p-8 space-y-4 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <h3 className="text-base md:text-lg font-bold text-slate-900">ประวัติการแจ้งซ่อม</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-red-100/80 backdrop-blur-md text-red-600 px-2.5 py-1 rounded-full font-semibold">
            {requests.length} รายการ
          </span>
          <button onClick={load} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg" title="รีเฟรช">
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-slate-400 text-xs">กำลังโหลดข้อมูล...</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-xs glass-card rounded-2xl">
          ไม่มีรายการแจ้งซ่อม
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
                <p className="text-red-500 font-medium text-xs my-0.5">
                  {item.status || "สถานะแจ้งซ่อม"}
                </p>
                <p className="text-slate-400 text-[10px] md:text-xs font-mono">
                  {formatFullDate(item.reported_date)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
