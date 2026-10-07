"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  DoorOpen,
  Wrench,
  Banknote,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  RefreshCw,
  Download,
  AlertTriangle,
  Lightbulb,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { sameRoom, shortStatus, assetStatusDotClass } from "@/lib/tenant-admin";
import {
  STATUS_REPORTED,
  STATUS_IN_PROGRESS,
  STATUS_DONE,
  AGE_CRITICAL_DAYS,
  REPLACE_REPAIR_COUNT,
  daysSince,
  isOpen,
  ageBadgeClass,
  downloadCsv,
  useDashboardData,
  computeOccupancy,
  computeMonthly,
} from "@/lib/dashboard";
import { ScrollReveal } from "@/components/ScrollReveal";
import { ProgressRing } from "@/components/ProgressRing";
import { Placeholder } from "@/components/admin/DashboardParts";

export default function AdminDashboardPage() {
  const { rooms, tenants, requests, assets, statuses, isLoading, loadedAt, load, now } = useDashboardData();

  const occupancy = useMemo(() => computeOccupancy(rooms, tenants), [rooms, tenants]);

  // ---------- Repair workload ----------
  const openRequests = useMemo(
    () =>
      requests
        .filter((r) => isOpen(r.status))
        .map((r) => ({ ...r, age: daysSince(r.reported_date, now) }))
        .sort((a, b) => b.age - a.age),
    [requests, now]
  );

  const pipeline = useMemo(() => {
    const count = (s: string) => requests.filter((r) => r.status === s).length;
    return [
      { label: shortStatus(STATUS_REPORTED), value: count(STATUS_REPORTED), bar: "bg-red-500", dot: "bg-red-500" },
      { label: shortStatus(STATUS_IN_PROGRESS), value: count(STATUS_IN_PROGRESS), bar: "bg-amber-400", dot: "bg-amber-400" },
      { label: shortStatus(STATUS_DONE), value: count(STATUS_DONE), bar: "bg-emerald-500", dot: "bg-emerald-500" },
    ];
  }, [requests]);

  const overdueCount = openRequests.filter((r) => r.age >= AGE_CRITICAL_DAYS).length;
  const missingCostCount = requests.filter((r) => r.status !== STATUS_REPORTED && r.repair_cost == null).length;

  // ---------- Monthly trend: last 12 months ----------
  const monthly = useMemo(() => computeMonthly(requests, now), [requests, now]);

  const thisMonth = monthly[11];
  const lastMonth = monthly[10];
  const costDelta = thisMonth.cost - lastMonth.cost;
  const maxMonthlyCount = Math.max(1, ...monthly.map((m) => m.count));
  const totalCost12m = monthly.reduce((s, m) => s + m.cost, 0);
  const totalCount12m = monthly.reduce((s, m) => s + m.count, 0);

  // ---------- Per-room health ----------
  const roomHealth = useMemo(
    () =>
      rooms
        .map((room) => {
          const roomReqs = requests.filter((r) => r.room_id === room.room_id);
          const tenant = tenants.find((t) => sameRoom(t.userName, room.room_number));
          return {
            room,
            tenant,
            total: roomReqs.length,
            open: roomReqs.filter((r) => isOpen(r.status)).length,
            cost: roomReqs.reduce((s, r) => s + Number(r.repair_cost ?? 0), 0),
            assets: assets.filter((a) => a.room_id === room.room_id).length,
          };
        })
        .sort((a, b) => b.cost - a.cost || b.total - a.total),
    [rooms, requests, tenants, assets]
  );

  // ---------- Per-product repair history ----------
  const productStats = useMemo(() => {
    const map = new Map<string, { name: string; count: number; cost: number; costed: number }>();
    for (const r of requests) {
      const name = r.products?.product_name ?? "ไม่ระบุ";
      const entry = map.get(name) ?? { name, count: 0, cost: 0, costed: 0 };
      entry.count += 1;
      if (r.repair_cost != null) {
        entry.cost += Number(r.repair_cost);
        entry.costed += 1;
      }
      map.set(name, entry);
    }
    return Array.from(map.values()).sort((a, b) => b.cost - a.cost || b.count - a.count);
  }, [requests]);

  const assetStatus = useMemo(
    () =>
      statuses
        .map((s) => ({ name: s.status_name, count: assets.filter((a) => a.status_id === s.status_id).length }))
        .filter((s) => s.count > 0),
    [statuses, assets]
  );

  // ---------- Auto-generated recommendations ----------
  const insights = useMemo(() => {
    const list: { tone: "red" | "amber" | "blue"; text: string }[] = [];
    if (overdueCount > 0) {
      list.push({ tone: "red", text: `มีงานซ่อมค้างเกิน ${AGE_CRITICAL_DAYS} วัน ${overdueCount} รายการ ควรเร่งดำเนินการหรือแจ้งความคืบหน้าให้ผู้เช่า` });
    }
    if (occupancy.vacant.length > 0) {
      list.push({
        tone: "amber",
        text: `ห้องว่าง ${occupancy.vacant.length} ห้อง (${occupancy.vacant.map((r) => r.room_number).join(", ")}) เสียโอกาสรายได้ ${formatCurrency(occupancy.vacancyLoss)} / เดือน`,
      });
    }
    for (const p of productStats.filter((p) => p.count >= REPLACE_REPAIR_COUNT)) {
      list.push({ tone: "amber", text: `${p.name} ถูกแจ้งซ่อม ${p.count} ครั้ง รวม ${formatCurrency(p.cost)} ควรพิจารณาเปลี่ยนใหม่แทนการซ่อม` });
    }
    if (costDelta > 0 && lastMonth.cost > 0) {
      list.push({ tone: "amber", text: `ค่าซ่อมเดือนนี้เพิ่มขึ้น ${formatCurrency(costDelta)} จากเดือนก่อน อย่าลืมเรียกเก็บจากผู้เช่าพร้อมค่าเช่า` });
    }
    if (missingCostCount > 0) {
      list.push({ tone: "blue", text: `มี ${missingCostCount} รายการที่ดำเนินการแล้วแต่ยังไม่บันทึกค่าซ่อม อาจเรียกเก็บค่าซ่อมจากผู้เช่าได้ไม่ครบ` });
    }
    return list;
  }, [overdueCount, occupancy, productStats, costDelta, lastMonth.cost, missingCostCount]);

  const exportCsv = () => {
    const roomById = new Map(rooms.map((r) => [r.room_id, r.room_number]));
    downloadCsv(`maintenance-report-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["เลขที่", "วันที่แจ้ง", "ห้อง", "ครุภัณฑ์", "รายละเอียด", "สถานะ", "ค่าซ่อม (บาท)", "ค้างมา (วัน)"],
      ...requests.map((r) => [
        r.maintenance_request_id,
        r.reported_date ? new Date(r.reported_date).toLocaleString("th-TH") : "",
        (r.room_id != null && roomById.get(r.room_id)) || "",
        r.products?.product_name ?? "",
        r.description ?? "",
        shortStatus(r.status),
        r.repair_cost ?? "",
        isOpen(r.status) ? daysSince(r.reported_date, now) : "",
      ]),
    ]);
  };

  const dash = (v: string | number) => (isLoading ? "-" : v);

  return (
    <div className="space-y-5 max-w-6xl mx-auto w-full">
      <ScrollReveal />

      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-slate-900">แดชบอร์ดบริหารหอพัก</h2>
          <p className="text-[11px] text-slate-400">
            {loadedAt ? `ข้อมูล ณ ${loadedAt.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })} น.` : "กำลังโหลดข้อมูล..."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCsv}
            disabled={isLoading || requests.length === 0}
            className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
          >
            <Download size={14} /> ส่งออกรายงานซ่อม (CSV)
          </button>
          <button onClick={load} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg" title="รีเฟรช">
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin/dashboard/occupancy" className="reveal tilt-card glass-card rounded-2xl p-4 flex items-center gap-4 group relative">
          <ProgressRing percent={isLoading ? 0 : occupancy.percent} size={60} />
          <div className="min-w-0">
            <p className="text-xs text-slate-400 font-medium">อัตราการเข้าพัก</p>
            <p className="text-xl font-bold text-slate-900 tabular-nums">
              {dash(`${occupancy.occupied.length}/${occupancy.rentable.length}`)} <span className="text-xs font-medium text-slate-400">ห้อง</span>
            </p>
            <p className="text-[11px] text-slate-500">ว่าง {dash(occupancy.vacant.length)} ห้อง</p>
          </div>
          <ChevronRight size={14} className="absolute top-4 right-4 text-slate-300 group-hover:text-brand-400 transition-colors" />
        </Link>

        <KpiCard
          href="/admin/dashboard/income"
          icon={Banknote}
          color="from-emerald-400 to-emerald-600"
          label="รายได้ค่าเช่าที่คาดการณ์ / เดือน"
          value={dash(formatCurrency(occupancy.expectedRent))}
          sub={occupancy.vacancyLoss > 0 ? `เสียโอกาสจากห้องว่าง ${formatCurrency(occupancy.vacancyLoss)}` : "ห้องเต็มทุกห้อง"}
        />

        <KpiCard
          href="/admin/dashboard/open-repairs"
          icon={Wrench}
          color="from-red-400 to-red-600"
          label="งานซ่อมที่ยังไม่เสร็จ"
          value={dash(`${openRequests.length} รายการ`)}
          sub={
            openRequests.length > 0
              ? `ค้างนานสุด ${openRequests[0].age} วัน · เกิน ${AGE_CRITICAL_DAYS} วัน ${overdueCount} รายการ`
              : "ไม่มีงานค้าง"
          }
          subClass={overdueCount > 0 ? "text-red-500" : undefined}
        />

        <KpiCard
          href="/admin/dashboard/repair-cost"
          icon={costDelta > 0 ? TrendingUp : TrendingDown}
          color="from-amber-400 to-amber-600"
          label={`ค่าซ่อมเรียกเก็บจากผู้เช่า ${thisMonth.label}`}
          value={dash(formatCurrency(thisMonth.cost))}
          sub={`${thisMonth.count} รายการ · ${costDelta >= 0 ? "▲" : "▼"} ${formatCurrency(Math.abs(costDelta))} จากเดือนก่อน`}
        />
      </div>

      {/* Recommendations */}
      {!isLoading && insights.length > 0 && (
        <div className="reveal glass-card rounded-2xl p-4">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
            <Lightbulb size={16} className="text-amber-500" /> ข้อเสนอแนะสำหรับทีมบริหาร
          </h3>
          <ul className="space-y-2">
            {insights.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                <span
                  className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                    item.tone === "red" ? "bg-red-500" : item.tone === "amber" ? "bg-amber-400" : "bg-brand-400"
                  }`}
                />
                {item.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Action list: oldest open requests first */}
        <div className="glass-card rounded-2xl p-4 lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <AlertTriangle size={16} className="text-red-500" /> งานซ่อมที่ต้องติดตาม
            </h3>
            <Link href="/admin/dashboard/open-repairs" className="flex items-center gap-0.5 text-xs font-semibold text-brand-600 hover:text-brand-700">
              ดูทั้งหมด <ChevronRight size={14} />
            </Link>
          </div>
          {isLoading ? (
            <Placeholder text="กำลังโหลดข้อมูล..." />
          ) : openRequests.length === 0 ? (
            <Placeholder text="ไม่มีงานซ่อมค้าง" />
          ) : (
            <div className="divide-y divide-brand-100">
              {openRequests.slice(0, 6).map((r) => (
                <div key={r.maintenance_request_id} className="py-2.5 flex items-center gap-3">
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-full shrink-0 flex items-center gap-1 ${ageBadgeClass(r.age)}`}>
                    <Clock size={10} /> {r.age} วัน
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {r.products?.product_name ?? "ไม่ระบุ"}{" "}
                      <span className="text-xs text-slate-400">· ห้อง {rooms.find((x) => x.room_id === r.room_id)?.room_number ?? "-"}</span>
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{r.description}</p>
                  </div>
                  <span className={`text-[10px] font-semibold shrink-0 ${r.status === STATUS_REPORTED ? "text-red-500" : "text-amber-500"}`}>
                    {shortStatus(r.status)}
                  </span>
                </div>
              ))}
              {openRequests.length > 6 && (
                <p className="pt-2.5 text-[11px] text-slate-400 text-center">และอีก {openRequests.length - 6} รายการ</p>
              )}
            </div>
          )}
        </div>

        {/* Pipeline */}
        <div className="glass-card rounded-2xl p-4 lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-900 mb-3">สถานะงานซ่อมทั้งหมด</h3>
          {isLoading ? (
            <Placeholder text="กำลังโหลดข้อมูล..." />
          ) : requests.length === 0 ? (
            <Placeholder text="ยังไม่มีการแจ้งซ่อม" />
          ) : (
            <>
              <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 mb-4">
                {pipeline.map((p) =>
                  p.value > 0 ? (
                    <div key={p.label} className={p.bar} style={{ width: `${(p.value / requests.length) * 100}%` }} title={`${p.label}: ${p.value}`} />
                  ) : null
                )}
              </div>
              <div className="space-y-2.5">
                {pipeline.map((p) => (
                  <div key={p.label} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className={`w-2.5 h-2.5 rounded-full ${p.dot}`} /> {p.label}
                    </span>
                    <span className="font-semibold text-slate-900 tabular-nums">
                      {p.value} <span className="text-slate-400 font-normal">({Math.round((p.value / requests.length) * 100)}%)</span>
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-brand-100 grid grid-cols-2 gap-3 text-center">
                <div>
                  <p className="text-base font-bold text-slate-900 tabular-nums">{requests.length}</p>
                  <p className="text-[10px] text-slate-400">แจ้งซ่อมทั้งหมด</p>
                </div>
                <div>
                  <p className="text-base font-bold text-slate-900 tabular-nums">
                    {formatCurrency(requests.reduce((s, r) => s + Number(r.repair_cost ?? 0), 0))}
                  </p>
                  <p className="text-[10px] text-slate-400">ค่าซ่อมสะสม</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 12-month trend */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <h3 className="text-sm font-bold text-slate-900">แนวโน้มการแจ้งซ่อม 12 เดือนล่าสุด</h3>
          <p className="text-[11px] text-slate-500">
            รวม {totalCount12m} ครั้ง · {formatCurrency(totalCost12m)}
          </p>
        </div>
        {isLoading ? (
          <Placeholder text="กำลังโหลดข้อมูล..." />
        ) : (
          <div className="overflow-x-auto">
            <div className="flex items-end justify-between gap-1.5 h-44 min-w-[520px]">
              {monthly.map((m, i) => (
                <div key={m.key} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
                  <span className="text-[10px] font-semibold text-slate-600">{m.count > 0 ? m.count : ""}</span>
                  <div
                    className={`w-full max-w-[26px] rounded-t-md transition-all ${
                      i === 11 ? "bg-gradient-to-t from-brand-700 to-brand-500" : "bg-gradient-to-t from-brand-400 to-brand-200"
                    }`}
                    style={{ height: `${m.count > 0 ? Math.max(6, (m.count / maxMonthlyCount) * 75) : 2}%` }}
                    title={`${m.label} ${m.year + 543}: ${m.count} ครั้ง, ${formatCurrency(m.cost)}`}
                  />
                  <span className="text-[10px] text-slate-500">{m.label}</span>
                  <span className="text-[9px] text-amber-600 font-medium h-3 whitespace-nowrap">
                    {m.cost > 0 ? `${m.cost.toLocaleString("th-TH")}฿` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Rooms */}
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <DoorOpen size={16} className="text-brand-500" /> ภาพรวมรายห้อง
            </h3>
            <Link href="/admin/tenants" className="flex items-center gap-0.5 text-xs font-semibold text-brand-600 hover:text-brand-700">
              ดูห้องพัก <ChevronRight size={14} />
            </Link>
          </div>
          {isLoading ? (
            <Placeholder text="กำลังโหลดข้อมูล..." />
          ) : roomHealth.length === 0 ? (
            <Placeholder text="ยังไม่มีห้องพัก" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[420px]">
                <thead>
                  <tr className="text-slate-400 text-left">
                    <th className="font-medium pb-2">ห้อง</th>
                    <th className="font-medium pb-2">ผู้เช่า</th>
                    <th className="font-medium pb-2 text-right">ค่าเช่า</th>
                    <th className="font-medium pb-2 text-right">แจ้งซ่อม</th>
                    <th className="font-medium pb-2 text-right">ค่าซ่อมสะสม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-100">
                  {roomHealth.map(({ room, tenant, total, open, cost, assets: assetCount }) => (
                    <tr key={room.room_id}>
                      <td className="py-2">
                        <p className="font-semibold text-slate-800">{room.room_number}</p>
                        <p className="text-[10px] text-slate-400">{assetCount} ครุภัณฑ์</p>
                      </td>
                      <td className="py-2">
                        {Number(room.rent_price) === 0 ? (
                          <span className="text-slate-400">-</span>
                        ) : tenant ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-700 font-semibold text-[10px]">มีผู้เช่า</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100/80 text-amber-700 font-semibold text-[10px]">ว่าง</span>
                        )}
                      </td>
                      <td className="py-2 text-right tabular-nums text-slate-600">{formatCurrency(room.rent_price)}</td>
                      <td className="py-2 text-right tabular-nums">
                        <span className="text-slate-800 font-semibold">{total}</span>
                        {open > 0 && <span className="text-red-500 text-[10px]"> (ค้าง {open})</span>}
                      </td>
                      <td className="py-2 text-right tabular-nums font-semibold text-slate-800">{formatCurrency(cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Products */}
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900">ครุภัณฑ์ที่มีค่าซ่อมสูง</h3>
            {assetStatus.length > 0 && (
              <div className="flex items-center gap-2.5 flex-wrap justify-end">
                {assetStatus.map((s) => (
                  <span key={s.name} className="flex items-center gap-1 text-[10px] text-slate-500">
                    <span className={`w-2 h-2 rounded-full ${assetStatusDotClass(s.name)}`} />
                    {shortStatus(s.name)} {s.count}
                  </span>
                ))}
              </div>
            )}
          </div>
          {isLoading ? (
            <Placeholder text="กำลังโหลดข้อมูล..." />
          ) : productStats.length === 0 ? (
            <Placeholder text="ยังไม่มีข้อมูลการซ่อม" />
          ) : (
            <div className="space-y-3">
              {productStats.slice(0, 6).map((p) => {
                const maxCost = Math.max(1, productStats[0].cost);
                return (
                  <div key={p.name}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-slate-800">
                        {p.name}
                        {p.count >= REPLACE_REPAIR_COUNT && (
                          <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-red-100/80 text-red-600 font-semibold">ควรเปลี่ยนใหม่</span>
                        )}
                      </span>
                      <span className="tabular-nums text-slate-500">
                        {p.count} ครั้ง · <span className="font-semibold text-slate-800">{formatCurrency(p.cost)}</span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-amber-100/70 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600"
                        style={{ width: `${(p.cost / maxCost) * 100}%` }}
                      />
                    </div>
                    {p.costed > 0 && (
                      <p className="text-[10px] text-slate-400 mt-0.5">เฉลี่ย {formatCurrency(p.cost / p.costed)} / ครั้ง</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  href,
  icon: Icon,
  color,
  label,
  value,
  sub,
  subClass,
}: {
  href: string;
  icon: LucideIcon;
  color: string;
  label: string;
  value: string | number;
  sub: string;
  subClass?: string;
}) {
  return (
    <Link href={href} className="reveal tilt-card glass-card rounded-2xl p-4 group relative">
      <div className="flex items-center gap-2.5 mb-2">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white bg-gradient-to-br ${color} shadow-glass-sm`}>
          <Icon size={18} />
        </div>
        <p className="text-xs text-slate-400 font-medium leading-tight">{label}</p>
      </div>
      <p className="text-xl font-bold text-slate-900 tabular-nums">{value}</p>
      <p className={`text-[11px] ${subClass ?? "text-slate-500"}`}>{sub}</p>
      <ChevronRight size={14} className="absolute top-4 right-4 text-slate-300 group-hover:text-brand-400 transition-colors" />
    </Link>
  );
}

