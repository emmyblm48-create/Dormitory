"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ImageUpload } from "@/components/ImageUpload";
import type { ViewRoomAsset } from "@/lib/types";

export default function ReportDamagePage() {
  const router = useRouter();
  const [assets, setAssets] = useState<ViewRoomAsset[]>([]);
  const [productId, setProductId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: assetData }, { data: roomIdData }] = await Promise.all([
        supabase.from("view_room_asset").select("*").order("product_name"),
        supabase.rpc("get_user_room_id"),
      ]);
      if (assetData) setAssets(assetData as ViewRoomAsset[]);
      if (typeof roomIdData === "number") setRoomId(roomIdData);
      setIsLoading(false);
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !description.trim()) return;
    setError(null);
    setIsSubmitting(true);
    const { error } = await supabase.from("maintenance_request").insert({
      product_id: Number(productId),
      description: description.trim(),
      image_path: imageUrl,
      room_id: roomId,
      status: "สถานะแจ้งซ่อม",
      reported_date: new Date().toISOString().slice(0, 10),
    });
    setIsSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push("/user/requests"), 1200);
  };

  if (isLoading) {
    return <div className="text-center py-10 text-slate-400 text-xs">กำลังโหลดข้อมูล...</div>;
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
        <CheckCircle2 className="text-emerald-500" size={48} />
        <p className="text-slate-800 font-semibold">แจ้งซ่อมสำเร็จ</p>
        <p className="text-slate-400 text-sm">กำลังนำท่านไปยังหน้าประวัติ...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-lg mx-auto w-full">
      <h3 className="text-base md:text-lg font-bold text-slate-900 mb-4">แจ้งซ่อมครุภัณฑ์เสียหาย</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">เลือกครุภัณฑ์</label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-sm"
          >
            <option value="">-- เลือกครุภัณฑ์ที่เสียหาย --</option>
            {assets.map((a) => (
              <option key={a.asset_id} value={a.product_id}>
                {a.product_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">รายละเอียดความเสียหาย</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            placeholder="อธิบายลักษณะความเสียหาย..."
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-sm resize-none"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">ถ่ายรูปความเสียหาย</label>
          <ImageUpload bucket="maintenanceImage" pathPrefix="reports" onChange={setImageUrl} />
        </div>

        {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3.5 rounded-xl shadow-md transition-colors text-base disabled:opacity-60"
        >
          {isSubmitting ? "กำลังส่ง..." : "ส่งเรื่องแจ้งซ่อม"}
        </button>
      </form>
    </div>
  );
}
