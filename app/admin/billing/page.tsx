"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Save, CheckCircle2, RotateCcw, Image as ImageIcon, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatImageUrl } from "@/lib/format";
import type { BillingSettings, Room, ViewRoomBill } from "@/lib/types";

const thb = (n: number) =>
  n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const monthLabel = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("th-TH", { year: "numeric", month: "long" });
};

const statusBadge: Record<string, string> = {
  pending: "bg-slate-100 text-slate-500",
  submitted: "bg-amber-100 text-amber-700",
  paid: "bg-emerald-100 text-emerald-700",
};

const statusLabel: Record<string, string> = {
  pending: "รอชำระ",
  submitted: "รอตรวจสอบสลิป",
  paid: "ชำระแล้ว",
};

const emptyForm = {
  room_id: "",
  billing_month: new Date().toISOString().slice(0, 7),
  rent_amount: "",
  water_amount: "",
  electricity_prev_reading: "",
  electricity_curr_reading: "",
  due_date: "",
};

export default function AdminBillingPage() {
  const [settings, setSettings] = useState<BillingSettings | null>(null);
  const [settingsForm, setSettingsForm] = useState({
    water_price: "",
    electricity_unit_price: "",
    late_fee_per_day: "",
    promptpay_id: "",
  });
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bills, setBills] = useState<ViewRoomBill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [slipPreview, setSlipPreview] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    const [s, r, b] = await Promise.all([
      supabase.from("billing_settings").select("*").eq("id", 1).maybeSingle(),
      supabase.from("rooms").select("*").order("room_number"),
      supabase.from("view_room_bills").select("*").order("billing_month", { ascending: false }),
    ]);
    if (s.data) {
      setSettings(s.data as BillingSettings);
      setSettingsForm({
        water_price: String(s.data.water_price),
        electricity_unit_price: String(s.data.electricity_unit_price),
        late_fee_per_day: String(s.data.late_fee_per_day),
        promptpay_id: s.data.promptpay_id,
      });
    }
    if (r.data) setRooms(r.data as Room[]);
    if (b.data) setBills(b.data as ViewRoomBill[]);
    setIsLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSavingSettings(true);
    const { error } = await supabase
      .from("billing_settings")
      .update({
        water_price: Number(settingsForm.water_price),
        electricity_unit_price: Number(settingsForm.electricity_unit_price),
        late_fee_per_day: Number(settingsForm.late_fee_per_day),
        promptpay_id: settingsForm.promptpay_id.trim(),
      })
      .eq("id", 1);
    setIsSavingSettings(false);
    if (error) {
      setError(error.message);
      return;
    }
    load();
  };

  const handleRoomChange = (roomId: string) => {
    const room = rooms.find((r) => String(r.room_id) === roomId);
    const lastBill = bills
      .filter((b) => String(b.room_id) === roomId)
      .sort((a, b) => b.billing_month.localeCompare(a.billing_month))[0];
    setForm((f) => ({
      ...f,
      room_id: roomId,
      rent_amount: room ? String(room.rent_price) : f.rent_amount,
      water_amount: settings ? String(settings.water_price) : f.water_amount,
      electricity_prev_reading: lastBill ? String(lastBill.electricity_curr_reading) : "0",
    }));
  };

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.room_id || !form.billing_month || !form.due_date) return;
    setError(null);
    setIsCreating(true);
    const { error } = await supabase.from("room_bills").insert({
      room_id: Number(form.room_id),
      billing_month: `${form.billing_month}-01`,
      rent_amount: Number(form.rent_amount || 0),
      water_amount: Number(form.water_amount || 0),
      electricity_prev_reading: Number(form.electricity_prev_reading || 0),
      electricity_curr_reading: Number(form.electricity_curr_reading || 0),
      electricity_unit_price: settings?.electricity_unit_price ?? 0,
      due_date: form.due_date,
    });
    setIsCreating(false);
    if (error) {
      setError(error.message.includes("duplicate") ? "ห้องนี้มีบิลของเดือนนี้อยู่แล้ว" : error.message);
      return;
    }
    setForm(emptyForm);
    load();
  };

  const markPaid = async (billId: number) => {
    const { error } = await supabase
      .from("room_bills")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("bill_id", billId);
    if (!error) load();
  };

  const rejectSlip = async (billId: number) => {
    if (!confirm("ปฏิเสธสลิปนี้และให้ผู้เช่าแนบสลิปใหม่?")) return;
    const { error } = await supabase
      .from("room_bills")
      .update({ status: "pending", slip_image: null, submitted_at: null })
      .eq("bill_id", billId);
    if (!error) load();
  };

  const filtered = useMemo(
    () => (statusFilter === "all" ? bills : bills.filter((b) => b.status === statusFilter)),
    [bills, statusFilter]
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full">
      <h2 className="text-lg md:text-xl font-bold text-slate-900">การชำระค่าห้อง</h2>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-2.5">{error}</div>}

      {/* Rate settings */}
      <form onSubmit={saveSettings} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
        <p className="text-sm font-bold text-slate-700">ตั้งค่าราคา</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">ค่าน้ำ (เหมาจ่าย/เดือน)</label>
            <input
              type="number"
              step="0.01"
              value={settingsForm.water_price}
              onChange={(e) => setSettingsForm((s) => ({ ...s, water_price: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">ค่าไฟ (บาท/หน่วย)</label>
            <input
              type="number"
              step="0.01"
              value={settingsForm.electricity_unit_price}
              onChange={(e) => setSettingsForm((s) => ({ ...s, electricity_unit_price: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">ค่าปรับล่าช้า (บาท/วัน)</label>
            <input
              type="number"
              step="0.01"
              value={settingsForm.late_fee_per_day}
              onChange={(e) => setSettingsForm((s) => ({ ...s, late_fee_per_day: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">เลข PromptPay</label>
            <input
              value={settingsForm.promptpay_id}
              onChange={(e) => setSettingsForm((s) => ({ ...s, promptpay_id: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isSavingSettings}
          className="bg-[#3182F6] hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-sm flex items-center gap-1.5"
        >
          <Save size={16} /> {isSavingSettings ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
        </button>
      </form>

      {/* Create bill */}
      <form onSubmit={handleCreateBill} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
        <p className="text-sm font-bold text-slate-700">ออกบิลใหม่</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">ห้องพัก</label>
            <select
              value={form.room_id}
              onChange={(e) => handleRoomChange(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- เลือกห้องพัก --</option>
              {rooms.map((r) => (
                <option key={r.room_id} value={r.room_id}>
                  {r.room_number}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">รอบบิล (เดือน)</label>
            <input
              type="month"
              value={form.billing_month}
              onChange={(e) => setForm((f) => ({ ...f, billing_month: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">วันครบกำหนดชำระ</label>
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">ค่าห้อง</label>
            <input
              type="number"
              step="0.01"
              value={form.rent_amount}
              onChange={(e) => setForm((f) => ({ ...f, rent_amount: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">ค่าน้ำ</label>
            <input
              type="number"
              step="0.01"
              value={form.water_amount}
              onChange={(e) => setForm((f) => ({ ...f, water_amount: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div />
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">เลขมิเตอร์ไฟ (เดือนก่อน)</label>
            <input
              type="number"
              step="0.01"
              value={form.electricity_prev_reading}
              onChange={(e) => setForm((f) => ({ ...f, electricity_prev_reading: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">เลขมิเตอร์ไฟ (เดือนนี้)</label>
            <input
              type="number"
              step="0.01"
              value={form.electricity_curr_reading}
              onChange={(e) => setForm((f) => ({ ...f, electricity_curr_reading: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">ค่าไฟโดยประมาณ</label>
            <div className="px-3 py-2 border border-dashed border-slate-200 rounded-lg text-sm text-slate-500 bg-slate-50">
              {thb(
                Math.max(
                  0,
                  Number(form.electricity_curr_reading || 0) - Number(form.electricity_prev_reading || 0)
                ) * (settings?.electricity_unit_price ?? 0)
              )}{" "}
              บาท
            </div>
          </div>
        </div>
        <button
          type="submit"
          disabled={isCreating}
          className="bg-[#3182F6] hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-sm flex items-center gap-1.5"
        >
          <Plus size={16} /> {isCreating ? "กำลังออกบิล..." : "ออกบิล"}
        </button>
      </form>

      {/* Bill list */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm font-bold text-slate-700">รายการบิลทั้งหมด</p>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">ทุกสถานะ</option>
          <option value="pending">รอชำระ</option>
          <option value="submitted">รอตรวจสอบสลิป</option>
          <option value="paid">ชำระแล้ว</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-slate-400" size={24} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm bg-white rounded-2xl border border-slate-100">
          ไม่มีรายการบิล
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <div key={b.bill_id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h4 className="font-bold text-slate-900">
                    ห้อง {b.room_number} · {monthLabel(b.billing_month)}
                  </h4>
                  <p className="text-xs text-slate-400">
                    กำหนดชำระ {b.due_date}
                    {b.late_fee > 0 ? ` · เกินกำหนด ค่าปรับ ${thb(b.late_fee)} บาท` : ""}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full h-fit ${statusBadge[b.status]}`}>
                  {statusLabel[b.status]}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-xs">
                <div className="bg-slate-50 rounded-lg px-3 py-2">
                  <p className="text-slate-400">ค่าห้อง</p>
                  <p className="font-semibold text-slate-800">{thb(b.rent_amount)}</p>
                </div>
                <div className="bg-slate-50 rounded-lg px-3 py-2">
                  <p className="text-slate-400">ค่าน้ำ</p>
                  <p className="font-semibold text-slate-800">{thb(b.water_amount)}</p>
                </div>
                <div className="bg-slate-50 rounded-lg px-3 py-2">
                  <p className="text-slate-400">
                    ค่าไฟ ({b.electricity_prev_reading}→{b.electricity_curr_reading} หน่วย)
                  </p>
                  <p className="font-semibold text-slate-800">{thb(b.electricity_amount)}</p>
                </div>
                <div className="bg-blue-50 rounded-lg px-3 py-2">
                  <p className="text-[#3182F6]/70">ยอดรวมทั้งหมด</p>
                  <p className="font-bold text-[#3182F6]">{thb(b.grand_total)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {b.slip_image && (
                  <button
                    onClick={() => setSlipPreview(formatImageUrl(b.slip_image, "paymentSlip"))}
                    className="flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg"
                  >
                    <ImageIcon size={14} /> ดูสลิป
                  </button>
                )}
                {b.status !== "paid" && (
                  <button
                    onClick={() => markPaid(b.bill_id)}
                    className="flex items-center gap-1.5 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-600 px-3 py-1.5 rounded-lg font-medium"
                  >
                    <CheckCircle2 size={14} /> ยืนยันชำระแล้ว
                  </button>
                )}
                {b.status === "submitted" && (
                  <button
                    onClick={() => rejectSlip(b.bill_id)}
                    className="flex items-center gap-1.5 text-xs bg-red-50 hover:bg-red-100 text-red-500 px-3 py-1.5 rounded-lg font-medium"
                  >
                    <RotateCcw size={14} /> ปฏิเสธสลิป
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {slipPreview && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setSlipPreview(null)}
        >
          <div className="relative max-w-sm w-full">
            <button
              onClick={() => setSlipPreview(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white"
            >
              <X size={24} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={slipPreview} alt="สลิปการชำระเงิน" className="w-full rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
}
