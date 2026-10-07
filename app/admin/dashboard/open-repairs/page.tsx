"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Clock } from "lucide-react";
import { formatFullDate } from "@/lib/format";
import { shortStatus } from "@/lib/tenant-admin";
import {
  AGE_CRITICAL_DAYS,
  AGE_WARN_DAYS,
  STATUS_IN_PROGRESS,
  STATUS_REPORTED,
  ageBadgeClass,
  daysSince,
  downloadCsv,
  isOpen,
  useDashboardData,
} from "@/lib/dashboard";
import { DetailHeader, ExportButton, Placeholder, StatTile } from "@/components/admin/DashboardParts";

const AGE_BUCKETS = [
  { label: `0-${AGE_WARN_DAYS - 1} วัน`, min: 0, max: AGE_WARN_DAYS - 1, bar: "bg-slate-400" },
  { label: `${AGE_WARN_DAYS}-${AGE_CRITICAL_DAYS - 1} วัน`, min: AGE_WARN_DAYS, max: AGE_CRITICAL_DAYS - 1, bar: "bg-amber-400" },
  { label: `${AGE_CRITICAL_DAYS}-13 วัน`, min: AGE_CRITICAL_DAYS, max: 13, bar: "bg-red-400" },
  { label: "14 วันขึ้นไป", min: 14, max: Infinity, bar: "bg-red-600" },
];

type Filter = "all" | typeof STATUS_REPORTED | typeof STATUS_IN_PROGRESS | "overdue";

export default function OpenRepairsDetailPage() {
  const { requests, isLoading, loadedAt, load, now, roomNumber } = useDashboardData();
  const [filter, setFilter] = useState<Filter>("all");

  const open = useMemo(
    () =>
      requests
        .filter((r) => isOpen(r.status))
        .map((r) => ({ ...r, age: daysSince(r.reported_date, now) }))
        .sort((a, b) => b.age - a.age),
    [requests, now]
  );

  const reported = open.filter((r) => r.status === STATUS_REPORTED);
  const inProgress = open.filter((r) => r.status === STATUS_IN_PROGRESS);
  const overdue = open.filter((r) => r.age >= AGE_CRITICAL_DAYS);
  const avgAge = open.length ? open.reduce((s, r) => s + r.age, 0) / open.length : 0;

  const buckets = AGE_BUCKETS.map((b) => ({ ...b, count: open.filter((r) => r.age >= b.min && r.age <= b.max).length }));
  const maxBucket = Math.max(1, ...buckets.map((b) => b.count));

  const byRoom = useMemo(() => {
    const map = new Map<string, { room: string; count: number; oldest: number }>();
    for (const r of open) {
      const room = roomNumber(r.room_id);
      const entry = map.get(room) ?? { room, count: 0, oldest: 0 };
      entry.count += 1;
      entry.oldest = Math.max(entry.oldest, r.age);
      map.set(room, entry);
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count || b.oldest - a.oldest);
  }, [open, roomNumber]);

  const visible =
    filter === "all" ? open : filter === "overdue" ? overdue : open.filter((r) => r.status === filter);

  const exportCsv = () =>
    downloadCsv(`open-repairs-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["เลขที่", "วันที่แจ้ง", "ห้อง", "ครุภัณฑ์", "รายละเอียด", "สถานะ", "ค้างมา (วัน)"],
      ...open.map((r) => [
        r.maintenance_request_id,
        r.reported_date ? new Date(r.reported_date).toLocaleString("th-TH") : "",
        roomNumber(r.room_id),
        r.products?.product_name ?? "",
        r.description ?? "",
        shortStatus(r.status),
        r.age,
      ]),
    ]);

  const dash = (v: string | number) => (isLoading ? "-" : v);

  const filters: [Filter, string, number][] = [
    ["all", "ทั้งหมด", open.length],
    [STATUS_REPORTED, shortStatus(STATUS_REPORTED), reported.length],
    [STATUS_IN_PROGRESS, shortStatus(STATUS_IN_PROGRESS), inProgress.length],
    ["overdue", `เกิน ${AGE_CRITICAL_DAYS} วัน`, overdue.length],
  ];

  return (
    <div className="space-y-5 max-w-5xl mx-auto w-full">
      <DetailHeader
        title="งานซ่อมที่ยังไม่เสร็จ"
        loadedAt={loadedAt}
        isLoading={isLoading}
        onRefresh={load}
        actions={<ExportButton onClick={exportCsv} disabled={isLoading || open.length === 0} />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="ยังไม่เริ่มดำเนินการ" value={dash(reported.length)} sub="สถานะแจ้งซ่อม" tone="text-red-500" />
        <StatTile label="กำลังดำเนินการ" value={dash(inProgress.length)} sub="รอซ่อมเสร็จ" tone="text-amber-600" />
        <StatTile label={`ค้างเกิน ${AGE_CRITICAL_DAYS} วัน`} value={dash(overdue.length)} sub={`จากทั้งหมด ${open.length} รายการ`} tone={overdue.length ? "text-red-500" : "text-slate-900"} />
        <StatTile label="ค้างเฉลี่ย" value={dash(`${avgAge.toFixed(1)} วัน`)} sub={open.length ? `นานสุด ${open[0].age} วัน` : "ไม่มีงานค้าง"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-4">
          <h3 className="text-sm font-bold text-slate-900 mb-3">ระยะเวลาที่ค้าง</h3>
          {isLoading ? (
            <Placeholder text="กำลังโหลดข้อมูล..." />
          ) : (
            <div className="space-y-3">
              {buckets.map((b) => (
                <div key={b.label} className="flex items-center gap-3 text-xs">
                  <span className="w-24 shrink-0 text-slate-600">{b.label}</span>
                  <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full rounded-full ${b.bar}`} style={{ width: `${(b.count / maxBucket) * 100}%` }} />
                  </div>
                  <span className="w-12 text-right font-semibold text-slate-800 tabular-nums">{b.count} งาน</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card rounded-2xl p-4">
          <h3 className="text-sm font-bold text-slate-900 mb-3">งานค้างแยกตามห้อง</h3>
          {isLoading ? (
            <Placeholder text="กำลังโหลดข้อมูล..." />
          ) : byRoom.length === 0 ? (
            <Placeholder text="ไม่มีงานค้าง" />
          ) : (
            <div className="divide-y divide-brand-100">
              {byRoom.map((r) => (
                <div key={r.room} className="py-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">ห้อง {r.room}</span>
                  <span className="text-slate-500">
                    <span className="font-semibold text-slate-800">{r.count}</span> งาน · นานสุด{" "}
                    <span className={r.oldest >= AGE_CRITICAL_DAYS ? "text-red-500 font-semibold" : ""}>{r.oldest} วัน</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <h3 className="text-sm font-bold text-slate-900">รายการงานค้าง (เรียงจากค้างนานสุด)</h3>
          <div className="flex items-center gap-1 text-xs flex-wrap">
            {filters.map(([key, label, count]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3 py-1 rounded-full font-semibold transition-colors ${
                  filter === key ? "bg-brand-600 text-white" : "bg-white/70 text-slate-500 hover:bg-white"
                }`}
              >
                {label} {count}
              </button>
            ))}
          </div>
        </div>
        {isLoading ? (
          <Placeholder text="กำลังโหลดข้อมูล..." />
        ) : visible.length === 0 ? (
          <Placeholder text="ไม่มีงานในกลุ่มนี้" />
        ) : (
          <div className="divide-y divide-brand-100">
            {visible.map((r) => (
              <div key={r.maintenance_request_id} className="py-2.5 flex items-center gap-3">
                <span className={`text-[10px] font-semibold px-2 py-1 rounded-full shrink-0 flex items-center gap-1 ${ageBadgeClass(r.age)}`}>
                  <Clock size={10} /> {r.age} วัน
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {r.products?.product_name ?? "ไม่ระบุ"} <span className="text-xs text-slate-400">· ห้อง {roomNumber(r.room_id)}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">{r.description}</p>
                  <p className="text-[10px] text-slate-400">แจ้งเมื่อ {formatFullDate(r.reported_date)}</p>
                </div>
                <span className={`text-[10px] font-semibold shrink-0 ${r.status === STATUS_REPORTED ? "text-red-500" : "text-amber-500"}`}>
                  {shortStatus(r.status)}
                </span>
              </div>
            ))}
          </div>
        )}
        <Link href="/admin/requests" className="mt-3 flex items-center justify-end gap-0.5 text-xs font-semibold text-brand-600 hover:text-brand-700">
          อัปเดตสถานะ / ค่าซ่อม <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}
