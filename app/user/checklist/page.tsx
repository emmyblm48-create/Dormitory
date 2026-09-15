"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, RefreshCw, RotateCcw, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getAssetIcon } from "@/components/icons";
import { ScrollReveal } from "@/components/ScrollReveal";
import { storageKey, readChecked } from "@/lib/checklist";
import type { ViewRoomAsset } from "@/lib/types";

export default function EquipmentChecklistPage() {
  const [assets, setAssets] = useState<ViewRoomAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const roomId = assets[0]?.room_id ?? null;

  const load = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("view_room_asset")
      .select("*")
      .order("product_name");
    if (!error && data) setAssets(data as ViewRoomAsset[]);
    setIsLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (roomId == null) return;
    setChecked(readChecked(roomId));
  }, [roomId]);

  const persist = (next: Set<number>) => {
    setChecked(next);
    if (roomId != null) {
      localStorage.setItem(storageKey(roomId), JSON.stringify(Array.from(next)));
    }
  };

  const toggle = (assetId: number) => {
    const next = new Set(checked);
    if (next.has(assetId)) next.delete(assetId);
    else next.add(assetId);
    persist(next);
  };

  const reset = () => persist(new Set());

  const progress = useMemo(
    () => (assets.length === 0 ? 0 : Math.round((checked.size / assets.length) * 100)),
    [assets.length, checked.size]
  );

  return (
    <div className="p-4 md:p-8 space-y-4 max-w-3xl mx-auto w-full">
      <ScrollReveal />
      <div className="flex items-center justify-between">
        <h3 className="text-base md:text-lg font-bold text-slate-900">เช็คอุปกรณ์ครุภัณฑ์</h3>
        <div className="flex items-center gap-2">
          <button onClick={reset} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg" title="รีเซ็ตรายการ">
            <RotateCcw size={16} />
          </button>
          <button onClick={load} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg" title="รีเฟรช">
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {!isLoading && assets.length > 0 && (
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
            <span>เช็คแล้ว {checked.size} / {assets.length} รายการ</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/60 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-slate-400 text-xs">กำลังโหลดข้อมูล...</div>
      ) : assets.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-xs glass-card rounded-2xl">
          ไม่มีรายการครุภัณฑ์ในห้องพัก
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {assets.map((item, i) => {
            const Icon = getAssetIcon(item.product_name);
            const isChecked = checked.has(item.asset_id);
            return (
              <div
                key={item.asset_id}
                style={{ transitionDelay: `${i * 40}ms` }}
                className={`reveal tilt-card relative rounded-3xl p-4 border flex flex-col items-center text-center gap-2 transition-colors backdrop-blur-xl backdrop-saturate-150 shadow-glass-sm ${
                  isChecked ? "bg-emerald-100/60 border-emerald-200/70" : "bg-white/70 border-white/60"
                }`}
              >
                <button
                  onClick={() => toggle(item.asset_id)}
                  className="flex flex-col items-center gap-2 w-full"
                >
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors bg-gradient-to-br ${
                      isChecked ? "from-emerald-400 to-emerald-600" : i % 2 === 0 ? "from-brand-400 to-brand-700" : "from-bloom-400 to-bloom-600"
                    }`}
                  >
                    <Icon />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 leading-tight">{item.product_name}</span>
                  <span className="text-[10px] text-slate-400">{item.status_name || "สถานะปกติ"}</span>
                </button>

                {isChecked && (
                  <CheckCircle2 className="absolute top-2 right-2 text-emerald-500 bg-white rounded-full" size={18} />
                )}

                <Link
                  href={`/user/report?productId=${item.product_id}`}
                  className="flex items-center gap-1 text-[10px] font-medium text-red-500 hover:text-red-600 mt-1"
                >
                  <AlertCircle size={12} /> แจ้งปัญหา
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
