"use client";

import { useMemo } from "react";
import { Info } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { computeMonthly, computeOccupancy, downloadCsv, monthKey, useDashboardData } from "@/lib/dashboard";
import { DetailHeader, ExportButton, Placeholder, StatTile } from "@/components/admin/DashboardParts";

// Repairs are paid by the tenant, so repair costs are billed on top of rent, never deducted from it
export default function IncomeDetailPage() {
  const { rooms, tenants, requests, isLoading, loadedAt, load, now } = useDashboardData();

  const occupancy = useMemo(() => computeOccupancy(rooms, tenants), [rooms, tenants]);
  const monthly = useMemo(() => computeMonthly(requests, now), [requests, now]);
  const thisMonth = monthly[monthly.length - 1];
  const currentKey = monthKey(new Date(now));

  const roomRows = useMemo(
    () =>
      occupancy.withTenant
        .map(({ room, tenant }) => {
          const rent = tenant ? Number(room.rent_price) : 0;
          const roomReqs = requests.filter((r) => r.room_id === room.room_id);
          const repairThisMonth = roomReqs
            .filter((r) => r.reported_date && monthKey(new Date(r.reported_date)) === currentKey)
            .reduce((s, r) => s + Number(r.repair_cost ?? 0), 0);
          const repairTotal = roomReqs.reduce((s, r) => s + Number(r.repair_cost ?? 0), 0);
          return { room, tenant, rent, repairThisMonth, repairTotal, billThisMonth: rent + repairThisMonth };
        })
        .sort((a, b) => b.billThisMonth - a.billThisMonth || a.room.room_number.localeCompare(b.room.room_number)),
    [occupancy, requests, currentKey]
  );

  // Rent per month is approximated from the current tenants, since rent payments aren't recorded
  const monthRows = monthly.map((m) => ({ ...m, rent: occupancy.expectedRent, total: occupancy.expectedRent + m.cost }));
  const maxTotal = Math.max(1, ...monthRows.map((m) => m.total));

  const exportCsv = () =>
    downloadCsv(`billing-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["ห้อง", "ชั้น", "สถานะ", "ผู้เช่า (อีเมล)", "ค่าเช่า (บาท)", "ค่าซ่อมเดือนนี้ (บาท)", "ยอดเรียกเก็บเดือนนี้ (บาท)", "ค่าซ่อมสะสม (บาท)"],
      ...roomRows.map((r) => [
        r.room.room_number,
        r.room.floor ?? "",
        r.tenant ? "มีผู้เช่า" : "ว่าง",
        r.tenant?.email ?? "",
        r.rent,
        r.repairThisMonth,
        r.billThisMonth,
        r.repairTotal,
      ]),
    ]);

  const dash = (v: string | number) => (isLoading ? "-" : v);

  return (
    <div className="space-y-5 max-w-5xl mx-auto w-full">
      <DetailHeader
        title="รายได้และยอดเรียกเก็บ"
        loadedAt={loadedAt}
        isLoading={isLoading}
        onRefresh={load}
        actions={<ExportButton onClick={exportCsv} disabled={isLoading || roomRows.length === 0} />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="ค่าเช่าที่คาดการณ์ / เดือน" value={dash(formatCurrency(occupancy.expectedRent))} sub={`จาก ${occupancy.occupied.length} ห้องที่มีผู้เช่า`} tone="text-emerald-600" />
        <StatTile label={`ค่าซ่อมเรียกเก็บเพิ่ม (${thisMonth.label})`} value={dash(formatCurrency(thisMonth.cost))} sub={`${thisMonth.count} รายการแจ้งซ่อม`} tone="text-amber-600" />
        <StatTile
          label={`ยอดเรียกเก็บรวม (${thisMonth.label})`}
          value={dash(formatCurrency(occupancy.expectedRent + thisMonth.cost))}
          sub="ค่าเช่า + ค่าซ่อม"
        />
        <StatTile
          label="เสียโอกาสจากห้องว่าง / เดือน"
          value={dash(formatCurrency(occupancy.vacancyLoss))}
          sub={occupancy.vacant.length ? `${occupancy.vacant.length} ห้องว่าง · เต็มศักยภาพ ${formatCurrency(occupancy.potentialRent)}` : "ไม่มีห้องว่าง"}
          tone={occupancy.vacancyLoss > 0 ? "text-amber-600" : "text-slate-900"}
        />
      </div>

      <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-brand-50/70 border border-brand-100 rounded-xl px-3 py-2">
        <Info size={14} className="text-brand-500 shrink-0 mt-px" />
        <span>
          ค่าซ่อมผู้เช่าเป็นผู้รับผิดชอบ จึงแสดงเป็นยอดที่เรียกเก็บเพิ่มจากค่าเช่า ไม่ได้หักออกจากรายได้ ·
          ค่าเช่าคิดจากห้องที่มีผู้เช่าในปัจจุบัน ยังไม่ใช่ยอดที่เก็บได้จริง เพราะระบบยังไม่มีการบันทึกการชำระเงิน
        </span>
      </div>

      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <h3 className="text-sm font-bold text-slate-900">ยอดเรียกเก็บ 12 เดือนล่าสุด</h3>
          <div className="flex items-center gap-3 text-[10px] text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /> ค่าเช่า (ประมาณ)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> ค่าซ่อม</span>
          </div>
        </div>
        {isLoading ? (
          <Placeholder text="กำลังโหลดข้อมูล..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[560px]">
              <thead>
                <tr className="text-slate-400 text-left">
                  <th className="font-medium pb-2 w-20">เดือน</th>
                  <th className="font-medium pb-2"></th>
                  <th className="font-medium pb-2 text-right w-24">ค่าเช่า</th>
                  <th className="font-medium pb-2 text-right w-24">ค่าซ่อม</th>
                  <th className="font-medium pb-2 text-right w-28">รวมเรียกเก็บ</th>
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
                        <div className="flex h-2 rounded-full overflow-hidden" style={{ width: `${(m.total / maxTotal) * 100}%` }}>
                          <div className="bg-emerald-400" style={{ width: `${(m.rent / Math.max(1, m.total)) * 100}%` }} />
                          <div className="bg-amber-500" style={{ width: `${(m.cost / Math.max(1, m.total)) * 100}%` }} />
                        </div>
                      </td>
                      <td className="py-2 text-right tabular-nums text-slate-600">{formatCurrency(m.rent)}</td>
                      <td className="py-2 text-right tabular-nums text-amber-600">{m.cost > 0 ? `+${formatCurrency(m.cost)}` : formatCurrency(0)}</td>
                      <td className="py-2 text-right tabular-nums font-semibold text-slate-800">{formatCurrency(m.total)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="glass-card rounded-2xl p-4">
        <h3 className="text-sm font-bold text-slate-900 mb-3">ยอดเรียกเก็บรายห้อง ({thisMonth.label} {thisMonth.year + 543})</h3>
        {isLoading ? (
          <Placeholder text="กำลังโหลดข้อมูล..." />
        ) : roomRows.length === 0 ? (
          <Placeholder text="ยังไม่มีห้องเช่า" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[520px]">
              <thead>
                <tr className="text-slate-400 text-left">
                  <th className="font-medium pb-2">ห้อง</th>
                  <th className="font-medium pb-2">สถานะ</th>
                  <th className="font-medium pb-2 text-right">ค่าเช่า</th>
                  <th className="font-medium pb-2 text-right">ค่าซ่อมเดือนนี้</th>
                  <th className="font-medium pb-2 text-right">รวมเรียกเก็บ</th>
                  <th className="font-medium pb-2 text-right">ค่าซ่อมสะสม</th>
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
                    <td className="py-2 text-right tabular-nums text-slate-600">{formatCurrency(r.rent)}</td>
                    <td className="py-2 text-right tabular-nums text-amber-600">{r.repairThisMonth > 0 ? `+${formatCurrency(r.repairThisMonth)}` : "-"}</td>
                    <td className="py-2 text-right tabular-nums font-semibold text-slate-900">{formatCurrency(r.billThisMonth)}</td>
                    <td className="py-2 text-right tabular-nums text-slate-500">{formatCurrency(r.repairTotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-brand-100 font-semibold text-slate-900">
                  <td className="pt-2" colSpan={2}>รวม</td>
                  <td className="pt-2 text-right tabular-nums">{formatCurrency(roomRows.reduce((s, r) => s + r.rent, 0))}</td>
                  <td className="pt-2 text-right tabular-nums text-amber-600">{formatCurrency(roomRows.reduce((s, r) => s + r.repairThisMonth, 0))}</td>
                  <td className="pt-2 text-right tabular-nums">{formatCurrency(roomRows.reduce((s, r) => s + r.billThisMonth, 0))}</td>
                  <td className="pt-2 text-right tabular-nums text-slate-500">{formatCurrency(roomRows.reduce((s, r) => s + r.repairTotal, 0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
