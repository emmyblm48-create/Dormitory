"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { sameRoom } from "@/lib/tenant-admin";
import { downloadCsv, isOpen, useDashboardData } from "@/lib/dashboard";
import { ProgressRing } from "@/components/ProgressRing";
import { DetailHeader, ExportButton, Placeholder, StatTile } from "@/components/admin/DashboardParts";

type Filter = "all" | "occupied" | "vacant";

export default function OccupancyDetailPage() {
  const { rooms, tenants, requests, assets, isLoading, loadedAt, load } = useDashboardData();
  const [filter, setFilter] = useState<Filter>("all");

  const roomRows = useMemo(
    () =>
      rooms.map((room) => {
        const tenant = tenants.find((t) => sameRoom(t.userName, room.room_number)) ?? null;
        const roomReqs = requests.filter((r) => r.room_id === room.room_id);
        return {
          room,
          tenant,
          rentable: Number(room.rent_price) > 0,
          assets: assets.filter((a) => a.room_id === room.room_id).length,
          openRepairs: roomReqs.filter((r) => isOpen(r.status)).length,
        };
      }),
    [rooms, tenants, requests, assets]
  );

  const rentable = roomRows.filter((r) => r.rentable);
  const occupied = rentable.filter((r) => r.tenant);
  const vacant = rentable.filter((r) => !r.tenant);
  const percent = rentable.length ? (occupied.length / rentable.length) * 100 : 0;

  const byFloor = useMemo(() => {
    const map = new Map<string, { floor: string; total: number; occupied: number }>();
    for (const r of roomRows.filter((x) => x.rentable)) {
      const floor = r.room.floor || "ไม่ระบุชั้น";
      const entry = map.get(floor) ?? { floor, total: 0, occupied: 0 };
      entry.total += 1;
      if (r.tenant) entry.occupied += 1;
      map.set(floor, entry);
    }
    return Array.from(map.values()).sort((a, b) => a.floor.localeCompare(b.floor));
  }, [roomRows]);

  const visible = roomRows.filter((r) =>
    filter === "occupied" ? r.rentable && r.tenant : filter === "vacant" ? r.rentable && !r.tenant : true
  );

  const exportCsv = () =>
    downloadCsv(`occupancy-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["ห้อง", "ชั้น", "สถานะ", "ผู้เช่า (อีเมล)", "ค่าเช่า (บาท)", "ครุภัณฑ์", "งานซ่อมค้าง"],
      ...roomRows.map((r) => [
        r.room.room_number,
        r.room.floor ?? "",
        !r.rentable ? "ไม่ใช่ห้องเช่า" : r.tenant ? "มีผู้เช่า" : "ว่าง",
        r.tenant?.email ?? "",
        Number(r.room.rent_price),
        r.assets,
        r.openRepairs,
      ]),
    ]);

  const dash = (v: string | number) => (isLoading ? "-" : v);

  return (
    <div className="space-y-5 max-w-5xl mx-auto w-full">
      <DetailHeader
        title="อัตราการเข้าพัก"
        loadedAt={loadedAt}
        isLoading={isLoading}
        onRefresh={load}
        actions={<ExportButton onClick={exportCsv} disabled={isLoading || rooms.length === 0} />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
          <ProgressRing percent={isLoading ? 0 : percent} size={52} />
          <div>
            <p className="text-xs text-slate-400 font-medium">อัตราการเข้าพัก</p>
            <p className="text-xl font-bold text-slate-900 tabular-nums">{dash(`${Math.round(percent)}%`)}</p>
          </div>
        </div>
        <StatTile label="ห้องที่มีผู้เช่า" value={dash(occupied.length)} sub={`จากห้องเช่า ${rentable.length} ห้อง`} tone="text-emerald-600" />
        <StatTile label="ห้องว่าง" value={dash(vacant.length)} sub={vacant.length ? vacant.map((r) => r.room.room_number).join(", ") : "ไม่มีห้องว่าง"} tone={vacant.length ? "text-amber-600" : "text-slate-900"} />
        <StatTile label="ห้องทั้งหมดในระบบ" value={dash(rooms.length)} sub={`ไม่ใช่ห้องเช่า ${rooms.length - rentable.length} ห้อง`} />
      </div>

      <div className="glass-card rounded-2xl p-4">
        <h3 className="text-sm font-bold text-slate-900 mb-3">การเข้าพักแยกตามชั้น</h3>
        {isLoading ? (
          <Placeholder text="กำลังโหลดข้อมูล..." />
        ) : byFloor.length === 0 ? (
          <Placeholder text="ยังไม่มีห้องเช่า" />
        ) : (
          <div className="space-y-3">
            {byFloor.map((f) => (
              <div key={f.floor}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-slate-800">ชั้น {f.floor}</span>
                  <span className="tabular-nums text-slate-500">
                    {f.occupied}/{f.total} ห้อง · <span className="font-semibold text-slate-800">{Math.round((f.occupied / f.total) * 100)}%</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-brand-100 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600" style={{ width: `${(f.occupied / f.total) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <h3 className="text-sm font-bold text-slate-900">รายการห้องพัก</h3>
          <div className="flex items-center gap-1 text-xs">
            {([
              ["all", "ทั้งหมด"],
              ["occupied", "มีผู้เช่า"],
              ["vacant", "ว่าง"],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3 py-1 rounded-full font-semibold transition-colors ${
                  filter === key ? "bg-brand-600 text-white" : "bg-white/70 text-slate-500 hover:bg-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {isLoading ? (
          <Placeholder text="กำลังโหลดข้อมูล..." />
        ) : visible.length === 0 ? (
          <Placeholder text="ไม่มีห้องในกลุ่มนี้" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {visible.map(({ room, tenant, rentable: isRentable, assets: assetCount, openRepairs }) => (
              <div key={room.room_id} className="rounded-xl border border-brand-100 bg-white/60 p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="font-bold text-slate-900">{room.room_number}</p>
                  {!isRentable ? (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100/80 text-slate-500 font-semibold text-[10px]">ไม่ใช่ห้องเช่า</span>
                  ) : tenant ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-700 font-semibold text-[10px]">มีผู้เช่า</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100/80 text-amber-700 font-semibold text-[10px]">ว่าง</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 truncate">{tenant ? tenant.email : isRentable ? "ยังไม่มีบัญชีผู้เช่า" : "-"}</p>
                <div className="mt-2 pt-2 border-t border-brand-100 grid grid-cols-3 text-center text-[10px] text-slate-400">
                  <div>
                    <p className="text-xs font-semibold text-slate-800 tabular-nums">{formatCurrency(room.rent_price)}</p>
                    ค่าเช่า
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800 tabular-nums">{assetCount}</p>
                    ครุภัณฑ์
                  </div>
                  <div>
                    <p className={`text-xs font-semibold tabular-nums ${openRepairs ? "text-red-500" : "text-slate-800"}`}>{openRepairs}</p>
                    งานซ่อมค้าง
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <Link href="/admin/tenants" className="mt-3 flex items-center justify-end gap-0.5 text-xs font-semibold text-brand-600 hover:text-brand-700">
          จัดการผู้เช่า/ห้องพัก <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}
