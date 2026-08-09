"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw, CheckCircle2, Clock, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatImageUrl } from "@/lib/format";
import { ImageUpload } from "@/components/ImageUpload";
import { PromptPayQR } from "@/components/PromptPayQR";
import type { BillingSettings, ViewRoomBill } from "@/lib/types";

const thb = (n: number) =>
  n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const monthLabel = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("th-TH", { year: "numeric", month: "long" });
};

export default function UserBillingPage() {
  const [bills, setBills] = useState<ViewRoomBill[]>([]);
  const [settings, setSettings] = useState<BillingSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [slipDrafts, setSlipDrafts] = useState<Record<number, string | null>>({});
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    const [b, s] = await Promise.all([
      supabase.from("view_room_bills").select("*").order("billing_month", { ascending: false }),
      supabase.from("billing_settings").select("*").eq("id", 1).maybeSingle(),
    ]);
    if (b.data) setBills(b.data as ViewRoomBill[]);
    if (s.data) setSettings(s.data as BillingSettings);
    setIsLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const submitSlip = async (billId: number) => {
    const slipUrl = slipDrafts[billId];
    if (!slipUrl) return;
    setError(null);
    setSubmittingId(billId);
    const { error } = await supabase.rpc("submit_payment_slip", {
      p_bill_id: billId,
      p_slip_url: slipUrl,
    });
    setSubmittingId(null);
    if (error) {
      setError(error.message);
      return;
    }
    setSlipDrafts((d) => ({ ...d, [billId]: null }));
    load();
  };

  if (isLoading) {
    return <div className="text-center py-10 text-slate-400 text-xs">กำลังโหลดข้อมูล...</div>;
  }

  return (
    <div className="p-4 md:p-8 space-y-4 max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <h3 className="text-base md:text-lg font-bold text-slate-900">ค่าห้องพัก</h3>
        <button onClick={load} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg" title="รีเฟรช">
          <RefreshCw size={16} />
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-2.5">{error}</div>}

      {bills.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-xs bg-white rounded-2xl border border-slate-100">
          ยังไม่มีบิลค่าห้อง
        </div>
      ) : (
        <div className="space-y-4">
          {bills.map((b) => (
            <div key={b.bill_id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-slate-900">{monthLabel(b.billing_month)}</h4>
                  <p className="text-xs text-slate-400">กำหนดชำระ {b.due_date}</p>
                </div>
                {b.status === "paid" && (
                  <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 h-fit">
                    <CheckCircle2 size={12} /> ชำระแล้ว
                  </span>
                )}
                {b.status === "submitted" && (
                  <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 h-fit">
                    <Clock size={12} /> รอตรวจสอบสลิป
                  </span>
                )}
                {b.status === "pending" && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-600 h-fit">
                    ยังไม่ชำระ
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 rounded-lg px-3 py-2">
                  <p className="text-slate-400">ค่าห้อง</p>
                  <p className="font-semibold text-slate-800">{thb(b.rent_amount)} บาท</p>
                </div>
                <div className="bg-slate-50 rounded-lg px-3 py-2">
                  <p className="text-slate-400">ค่าน้ำ</p>
                  <p className="font-semibold text-slate-800">{thb(b.water_amount)} บาท</p>
                </div>
                <div className="bg-slate-50 rounded-lg px-3 py-2 col-span-2">
                  <p className="text-slate-400">
                    ค่าไฟ ({b.electricity_prev_reading} → {b.electricity_curr_reading} หน่วย ×{" "}
                    {thb(b.electricity_unit_price)} บาท/หน่วย)
                  </p>
                  <p className="font-semibold text-slate-800">{thb(b.electricity_amount)} บาท</p>
                </div>
                {b.late_fee > 0 && (
                  <div className="bg-red-50 rounded-lg px-3 py-2 col-span-2">
                    <p className="text-red-400">ค่าปรับชำระล่าช้า</p>
                    <p className="font-semibold text-red-600">{thb(b.late_fee)} บาท</p>
                  </div>
                )}
                <div className="bg-blue-50 rounded-lg px-3 py-2 col-span-2">
                  <p className="text-[#3182F6]/70">ยอดรวมที่ต้องชำระ</p>
                  <p className="font-bold text-[#3182F6] text-base">{thb(b.grand_total)} บาท</p>
                </div>
              </div>

              {b.status === "paid" && b.slip_image && (
                <div className="pt-1">
                  <p className="text-xs text-slate-400 mb-1.5">สลิปที่แนบไว้</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={formatImageUrl(b.slip_image, "paymentSlip") ?? undefined}
                    alt="สลิป"
                    className="w-full max-w-[200px] rounded-xl border border-slate-200"
                  />
                </div>
              )}

              {b.status === "submitted" && b.slip_image && (
                <div className="pt-1">
                  <p className="text-xs text-slate-400 mb-1.5">สลิปที่ส่ง กำลังรอผู้ดูแลตรวจสอบ</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={formatImageUrl(b.slip_image, "paymentSlip") ?? undefined}
                    alt="สลิป"
                    className="w-full max-w-[200px] rounded-xl border border-slate-200"
                  />
                </div>
              )}

              {b.status === "pending" && (
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <div className="flex justify-center">
                    <PromptPayQR promptpayId={settings?.promptpay_id ?? ""} amount={b.grand_total} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">แนบสลิปการชำระเงิน</label>
                    <ImageUpload
                      bucket="paymentSlip"
                      pathPrefix={`room-${b.room_id}`}
                      value={slipDrafts[b.bill_id] ?? null}
                      onChange={(url) => setSlipDrafts((d) => ({ ...d, [b.bill_id]: url }))}
                    />
                  </div>
                  <button
                    onClick={() => submitSlip(b.bill_id)}
                    disabled={!slipDrafts[b.bill_id] || submittingId === b.bill_id}
                    className="w-full flex items-center justify-center gap-2 bg-[#3182F6] hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-md transition-colors text-sm disabled:opacity-50"
                  >
                    {submittingId === b.bill_id ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Upload size={16} />
                    )}
                    ส่งหลักฐานการชำระเงิน
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
