"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatFullDate } from "@/lib/format";
import { AssetAvatar } from "@/components/AssetAvatar";
import type { ViewRoomAsset } from "@/lib/types";

export default function UserDashboardPage() {
  const [assets, setAssets] = useState<ViewRoomAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("view_room_asset")
      .select("*")
      .order("asset_id", { ascending: false });
    if (!error && data) setAssets(data as ViewRoomAsset[]);
    setIsLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-4 md:p-8 space-y-4 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <h3 className="text-base md:text-lg font-bold text-slate-900">ครุภัณฑ์ในห้องพัก</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-blue-100 text-[#0B57D0] px-2.5 py-1 rounded-full font-semibold">
            {assets.length} รายการ
          </span>
          <button onClick={load} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg" title="รีเฟรช">
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-slate-400 text-xs">กำลังโหลดข้อมูล...</div>
      ) : assets.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-xs bg-white rounded-2xl border border-slate-100">
          ไม่มีรายการครุภัณฑ์ในห้องพัก
        </div>
      ) : (
        <div className="space-y-3">
          {assets.map((item) => (
            <div key={item.asset_id} className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 flex items-center gap-3.5 hover:shadow-md transition-shadow">
              <AssetAvatar imageUrl={item.product_image} name={item.product_name} />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-900 text-base md:text-lg leading-tight truncate">
                  {item.product_name}
                </h4>
                <p className="text-[#0B57D0] font-medium text-xs my-0.5">
                  {item.status_name || "สถานะปกติ"}
                </p>
                <p className="text-slate-400 text-[10px] md:text-xs font-mono">
                  {formatFullDate(item.date_add)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
