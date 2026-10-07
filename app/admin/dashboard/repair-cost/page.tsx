"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, AlertCircle } from "lucide-react";
import { formatCurrency, formatFullDate } from "@/lib/format";
import { shortStatus } from "@/lib/tenant-admin";
import {
  STATUS_REPORTED,
  computeMonthly,
  computeOccupancy,
  downloadCsv,
  monthKey,
  monthKeyLabel,
  useDashboardData,
} from "@/lib/dashboard";
import { DetailHeader, ExportButton, Placeholder, StatTile } from "@/components/admin/DashboardParts";

const groupCost = <T,>(rows: T[], keyOf: (r: T) => string, costOf: (r: T) => number) => {
  const map = new Map<string, { name: string; count: number; cost: number }>();
  for (const r of rows) {
    const name = keyOf(r);
    const entry = map.get(name) ?? { name, count: 0, cost: 0 };
    entry.count += 1;
    entry.cost += costOf(r);
    map.set(name, entry);
  }
  return Array.from(map.values()).sort((a, b) => b.cost - a.cost || b.count - a.count);
};

export default function RepairCostDetailPage() {
  const { rooms, tenants, requests, isLoading, loadedAt, load, now, roomNumber } = useDashboardData();
  const monthly = useMemo(() => computeMonthly(requests, now), [requests, now]);
  const occupancy = useMemo(() => computeOccupancy(rooms, tenants), [rooms, tenants]);

  const [selectedKey, setSelectedKey] = useState<number>(() => monthKey(new Date()));
  useEffect(() => {
    if (loadedAt) setSelectedKey(monthKey(loadedAt));
  }, [loadedAt]);

  const selectedIndex = monthly.findIndex((m) => m.key === selectedKey);
  const selected = monthly[selectedIndex] ?? monthly[monthly.length - 1];
  const previous = selectedIndex > 0 ? monthly[selectedIndex - 1] : null;
  const delta = previous ? selected.cost - previous.cost : 0;

  const monthRequests = useMemo(
    () =>
      requests
        .filter((r) => r.reported_date && monthKey(new Date(r.reported_date)) === selected.key)
        .sort((a, b) => Number(b.repair_cost ?? 0) - Number(a.repair_cost ?? 0)),
    [requests, selected.key]
  );

  const costed = monthRequests.filter((r) => r.repair_cost != null);
  const missingCost = monthRequests.filter((r) => r.repair_cost == null && r.status !== STATUS_REPORTED);
  const avgCost = costed.length ? selected.cost / costed.length : 0;
  const rentPercent = occupancy.expectedRent ? (selected.cost / occupancy.expectedRent) * 100 : 0;

  const byProduct = groupCost(monthRequests, (r) => r.products?.product_name ?? "ไม่ระบุ", (r) => Number(r.repair_cost ?? 0));
  const byRoom = groupCost(monthRequests, (r) => `ห้อง ${roomNumber(r.room_id)}`, (r) => Number(r.repair_cost ?? 0));

  const maxMonthCost = Math.max(1, ...monthly.map((m) => m.cost));

  const exportCsv = () =>
    downloadCsv(`repair-cost-${selected.year}-${String((selected.key % 12) + 1).padStart(2, "0")}.csv`, [
      ["เลขที่", "วันที่แจ้ง", "ห้อง", "ครุภัณฑ์", "รายละเอียด", "สถานะ", "ค่าซ่อม (บาท)"],
      ...monthRequests.map((r) => [
        r.maintenance_request_id,
        r.reported_date ? new Date(r.reported_date).toLocaleString("th-TH") : "",
        roomNumber(r.room_id),
        r.products?.product_name ?? "",
        r.description ?? "",
        shortStatus(r.status),
        r.repair_cost ?? "",
      ]),
    ]);

  const dash = (v: string | number) => (isLoading ? "-" : v);

  return (
    <div className="space-y-5 max-w-5xl mx-auto w-full">
      <DetailHeader
        title="ค่าซ่อมรายเดือน"
        loadedAt={loadedAt}
        isLoading={isLoading}
        onRefresh={load}
        actions={
          <>
            <select
              value={selected.key}
              onChange={(e) => setSelectedKey(Number(e.target.value))}
              className="glass-input !w-auto px-2.5 py-1.5 rounded-lg text-xs"
            >
              {monthly
                .slice()
                .reverse()
                .map((m) => (
                  <option key={m.key} value={m.key}>
                    {monthKeyLabel(m.key)}
                  </option>
                ))}
            </select>
            <ExportButton onClick={exportCsv} disabled={isLoading || monthRequests.length === 0} />
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label={`ค่าซ่อม ${monthKeyLabel(selected.key)}`}
          value={dash(formatCurrency(selected.cost))}
          sub={previous ? `${delta > 0 ? "▲" : delta < 0 ? "▼" : "•"} ${formatCurrency(Math.abs(delta))} จาก ${monthKeyLabel(previous.key)}` : undefined}
          tone="text-amber-600"
        />
        <StatTile label="จำนวนการแจ้งซ่อม" value={dash(`${monthRequests.length} รายการ`)} sub={`บันทึกค่าซ่อมแล้ว ${costed.length} รายการ`} />
        <StatTile label="ค่าซ่อมเฉลี่ย / รายการ" value={dash(formatCurrency(avgCost))} sub="เฉพาะรายการที่บันทึกค่าซ่อม" />
        <StatTile
          label="สัดส่วนต่อรายได้ค่าเช่า"
          value={dash(`${rentPercent.toFixed(1)}%`)}
          sub={`ค่าเช่าที่คาดการณ์ ${formatCurrency(occupancy.expectedRent)}`}
          tone={rentPercent >= 10 ? "text-red-500" : "text-slate-900"}
        />
      </div>

      {missingCost.length > 0 && (
        <div className="flex items-start gap-2 text-[11px] text-amber-700 bg-amber-50/80 border border-amber-200 rounded-xl px-3 py-2">
          <AlertCircle size={14} className="shrink-0 mt-px" />
          มี {missingCost.length} รายการในเดือนนี้ที่ดำเนินการแล้วแต่ยังไม่บันทึกค่าซ่อม ยอดรวมอาจต่ำกว่าความจริง
        </div>
      )}

      <div className="glass-card rounded-2xl p-4">
        <h3 className="text-sm font-bold text-slate-900 mb-4">ค่าซ่อม 12 เดือนล่าสุด <span className="text-[11px] font-normal text-slate-400">(กดแท่งเพื่อดูรายละเอียดเดือนนั้น)</span></h3>
        {isLoading ? (
          <Placeholder text="กำลังโหลดข้อมูล..." />
        ) : (
          <div className="overflow-x-auto">
            <div className="flex items-end justify-between gap-1.5 h-44 min-w-[520px]">
              {monthly.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setSelectedKey(m.key)}
                  className="flex-1 flex flex-col items-center justify-end gap-1 h-full group"
                  title={`${monthKeyLabel(m.key)}: ${formatCurrency(m.cost)} (${m.count} รายการ)`}
                >
                  <span className="text-[9px] font-semibold text-slate-600 whitespace-nowrap">{m.cost > 0 ? m.cost.toLocaleString("th-TH") : ""}</span>
                  <div
                    className={`w-full max-w-[26px] rounded-t-md transition-all ${
                      m.key === selected.key ? "bg-gradient-to-t from-amber-600 to-amber-400" : "bg-amber-200 group-hover:bg-amber-300"
                    }`}
                    style={{ height: `${m.cost > 0 ? Math.max(6, (m.cost / maxMonthCost) * 80) : 2}%` }}
                  />
                  <span className={`text-[10px] ${m.key === selected.key ? "text-amber-700 font-bold" : "text-slate-500"}`}>{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[
          { title: "แยกตามครุภัณฑ์", rows: byProduct },
          { title: "แยกตามห้อง", rows: byRoom },
        ].map(({ title, rows }) => (
          <div key={title} className="glass-card rounded-2xl p-4">
            <h3 className="text-sm font-bold text-slate-900 mb-3">{title}</h3>
            {isLoading ? (
              <Placeholder text="กำลังโหลดข้อมูล..." />
            ) : rows.length === 0 ? (
              <Placeholder text="ไม่มีการแจ้งซ่อมในเดือนนี้" />
            ) : (
              <div className="space-y-3">
                {rows.map((p) => (
                  <div key={p.name}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-slate-800">{p.name}</span>
                      <span className="tabular-nums text-slate-500">
                        {p.count} รายการ · <span className="font-semibold text-slate-800">{formatCurrency(p.cost)}</span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-amber-100/70 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600"
                        style={{ width: `${(p.cost / Math.max(1, rows[0].cost)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-4">
        <h3 className="text-sm font-bold text-slate-900 mb-3">รายการซ่อม {monthKeyLabel(selected.key)}</h3>
        {isLoading ? (
          <Placeholder text="กำลังโหลดข้อมูล..." />
        ) : monthRequests.length === 0 ? (
          <Placeholder text="ไม่มีการแจ้งซ่อมในเดือนนี้" />
        ) : (
          <div className="divide-y divide-brand-100">
            {monthRequests.map((r) => (
              <div key={r.maintenance_request_id} className="py-2.5 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {r.products?.product_name ?? "ไม่ระบุ"} <span className="text-xs text-slate-400">· ห้อง {roomNumber(r.room_id)}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">{r.description}</p>
                  <p className="text-[10px] text-slate-400">
                    {formatFullDate(r.reported_date)} · {shortStatus(r.status)}
                  </p>
                </div>
                {r.repair_cost != null ? (
                  <span className="text-sm font-bold text-amber-600 tabular-nums shrink-0">{formatCurrency(r.repair_cost)}</span>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-400 shrink-0">ยังไม่บันทึกค่าซ่อม</span>
                )}
              </div>
            ))}
          </div>
        )}
        <Link href="/admin/requests" className="mt-3 flex items-center justify-end gap-0.5 text-xs font-semibold text-brand-600 hover:text-brand-700">
          แก้ไขค่าซ่อม <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}
