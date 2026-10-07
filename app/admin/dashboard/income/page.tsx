"use client";

import { useMemo } from "react";
import { Info } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { computeMonthly, computeOccupancy, downloadCsv, useDashboardData } from "@/lib/dashboard";
import { DetailHeader, ExportButton, Placeholder, StatTile } from "@/components/admin/DashboardParts";

export default function IncomeDetailPage() {
  const { rooms, tenants, requests, isLoading, loadedAt, load, now } = useDashboardData();

  const occupancy = useMemo(() => computeOccupancy(rooms, tenants), [rooms, tenants]);
  const monthly = useMemo(() => computeMonthly(requests, now), [requests, now]);

  const roomRows = useMemo(
    () =>
      occupancy.withTenant
        .map(({ room, tenant }) => {
          const rent = Number(room.rent_price);
          const repairCost = requests
            .filter((r) => r.room_id === room.room_id)
            .reduce((s, r) => s + Number(r.repair_cost ?? 0), 0);
          return { room, tenant, rent, repairCost, repairPercent: rent ? (repairCost / (rent * 12)) * 100 : 0 };
        })
        .sort((a, b) => b.rent - a.rent || a.room.room_number.localeCompare(b.room.room_number)),
    [occupancy, requests]
  );

  // Rent per month is approximated from the current tenants, since rent payments aren't recorded
  const monthRows = monthly.map((m) => ({ ...m, rent: occupancy.expectedRent, net: occupancy.expectedRent - m.cost }));
  const maxBar = Math.max(1, occupancy.expectedRent, ...monthly.map((m) => m.cost));
  const totalCost12m = monthly.reduce((s, m) => s + m.cost, 0);

  const exportCsv = () =>
    downloadCsv(`income-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["ห้อง", "ชั้น", "สถานะ", "ค่าเช่า/เดือน (บาท)", "ค่าซ่อมสะสม (บาท)", "ค่าซ่อมต่อค่าเช่าทั้งปี (%)"],
      ...roomRows.map((r) => [
        r.room.room_number,
        r.room.floor ?? "",
        r.tenant ? "มีผู้เช่า" : "ว่าง",
        r.rent,
        r.repairCost,
        r.repairPercent.toFixed(1),
      ]),
    ]);

  const dash = (v: string | number) => (isLoading ? "-" : v);

  return (
    <div className="space-y-5 max-w-5xl mx-auto w-full">
      <DetailHeader
        title="รายได้ค่าเช่า"
        loadedAt={loadedAt}
        isLoading={isLoading}
        onRefresh={load}
        actions={<ExportButton onClick={exportCsv} disabled={isLoading || roomRows.length === 0} />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="รายได้ที่คาดการณ์ / เดือน" value={dash(formatCurrency(occupancy.expectedRent))} sub={`จาก ${occupancy.occupied.length} ห้องที่มีผู้เช่า`} tone="text-emerald-600" />
        <StatTile label="รายได้เต็มศักยภาพ / เดือน" value={dash(formatCurrency(occupancy.potentialRent))} sub="ถ้าห้องเช่าเต็มทุกห้อง" />
        <StatTile
          label="เสียโอกาสจากห้องว่าง / เดือน"
          value={dash(formatCurrency(occupancy.vacancyLoss))}
          sub={occupancy.vacant.length ? `${occupancy.vacant.length} ห้องว่าง` : "ไม่มีห้องว่าง"}
          tone={occupancy.vacancyLoss > 0 ? "text-amber-600" : "text-slate-900"}
        />
        <StatTile label="รายได้ที่คาดการณ์ / ปี" value={dash(formatCurrency(occupancy.expectedRent * 12))} sub={`หักค่าซ่อม 12 เดือน เหลือ ${formatCurrency(occupancy.expectedRent * 12 - totalCost12m)}`} />
      </div>

      <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-brand-50/70 border border-brand-100 rounded-xl px-3 py-2">
        <Info size={14} className="text-brand-500 shrink-0 mt-px" />
        ตัวเลขรายได้คิดจากค่าเช่าของห้องที่มีผู้เช่าในปัจจุบัน ยังไม่ใช่ยอดที่เก็บได้จริง เพราะระบบยังไม่มีการบันทึกการชำระค่าเช่า
      </div>

      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <h3 className="text-sm font-bold text-slate-900">ค่าเช่าเทียบค่าซ่อม 12 เดือนล่าสุด</h3>
          <div className="flex items-center gap-3 text-[10px] text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /> ค่าเช่า (ประมาณ)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> ค่าซ่อม</span>
          </div>
        </div>
        {isLoading ? (
          <Placeholder text="กำลังโหลดข้อมูล..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[520px]">
              <thead>
                <tr className="text-slate-400 text-left">
                  <th className="font-medium pb-2 w-20">เดือน</th>
                  <th className="font-medium pb-2"></th>
                  <th className="font-medium pb-2 text-right w-24">ค่าซ่อม</th>
                  <th className="font-medium pb-2 text-right w-28">คงเหลือ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100">
                {monthRows
                  .slice()
                  .reverse()
                  .map((m) => (
                    <tr key={m.key}>
                      <td className="py-2 text-slate-700">
                        {m.label} {m.year + 543}
                      </td>
                      <td className="py-2 pr-3">
                        <div className="space-y-1">
                          <div className="h-1.5 rounded-full bg-emerald-400" style={{ width: `${(m.rent / maxBar) * 100}%` }} />
                          <div className="h-1.5 rounded-full bg-amber-500" style={{ width: `${Math.max(m.cost > 0 ? 1 : 0, (m.cost / maxBar) * 100)}%` }} />
                        </div>
                      </td>
                      <td className="py-2 text-right tabular-nums text-amber-600">{formatCurrency(m.cost)}</td>
                      <td className={`py-2 text-right tabular-nums font-semibold ${m.net < 0 ? "text-red-500" : "text-slate-800"}`}>{formatCurrency(m.net)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="glass-card rounded-2xl p-4">
        <h3 className="text-sm font-bold text-slate-900 mb-3">ค่าเช่าและต้นทุนซ่อมรายห้อง</h3>
        {isLoading ? (
          <Placeholder text="กำลังโหลดข้อมูล..." />
        ) : roomRows.length === 0 ? (
          <Placeholder text="ยังไม่มีห้องเช่า" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[480px]">
              <thead>
                <tr className="text-slate-400 text-left">
                  <th className="font-medium pb-2">ห้อง</th>
                  <th className="font-medium pb-2">สถานะ</th>
                  <th className="font-medium pb-2 text-right">ค่าเช่า / เดือน</th>
                  <th className="font-medium pb-2 text-right">ค่าซ่อมสะสม</th>
                  <th className="font-medium pb-2 text-right">เทียบค่าเช่าทั้งปี</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100">
                {roomRows.map((r) => (
                  <tr key={r.room.room_id}>
                    <td className="py-2 font-semibold text-slate-800">{r.room.room_number}</td>
                    <td className="py-2">
                      {r.tenant ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-700 font-semibold text-[10px]">มีผู้เช่า</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100/80 text-amber-700 font-semibold text-[10px]">ว่าง</span>
                      )}
                    </td>
                    <td className="py-2 text-right tabular-nums text-slate-800">{formatCurrency(r.rent)}</td>
                    <td className="py-2 text-right tabular-nums text-amber-600">{formatCurrency(r.repairCost)}</td>
                    <td className={`py-2 text-right tabular-nums font-semibold ${r.repairPercent >= 10 ? "text-red-500" : "text-slate-600"}`}>
                      {r.repairPercent.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-brand-100 font-semibold text-slate-900">
                  <td className="pt-2" colSpan={2}>รวม (เฉพาะห้องที่มีผู้เช่า)</td>
                  <td className="pt-2 text-right tabular-nums">{formatCurrency(occupancy.expectedRent)}</td>
                  <td className="pt-2 text-right tabular-nums text-amber-600">{formatCurrency(roomRows.reduce((s, r) => s + r.repairCost, 0))}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
