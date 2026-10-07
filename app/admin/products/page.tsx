"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, Plus, Loader2, Check, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ImageUpload } from "@/components/ImageUpload";
import { AssetAvatar } from "@/components/AssetAvatar";
import type { Category, Product, RoomAsset } from "@/lib/types";

interface FormState {
  product_name: string;
  category_id: string;
  date_recieved: string;
  product_image: string | null;
}

const emptyForm = (): FormState => ({
  product_name: "",
  category_id: "",
  date_recieved: new Date().toISOString().slice(0, 10),
  product_image: null,
});

// Products are the web app's equipment catalog — one row per kind of item, not
// tied to any room. Rooms pick items from here on the tenants page (room_asset).
export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [roomAssets, setRoomAssets] = useState<RoomAsset[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [query, setQuery] = useState("");

  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = async () => {
    const [p, ra, c] = await Promise.all([
      supabase.from("products").select("*").order("product_name"),
      supabase.from("room_asset").select("*"),
      supabase.from("categories").select("*").order("category_name"),
    ]);
    if (p.data) setProducts(p.data as Product[]);
    if (ra.data) setRoomAssets(ra.data as RoomAsset[]);
    if (c.data) setCategories(c.data as Category[]);
    setIsLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
  };

  const startEdit = (product: Product) => {
    setEditingId(product.product_id);
    setSuccess(null);
    setForm({
      product_name: product.product_name,
      category_id: String(product.category_id ?? ""),
      date_recieved: product.date_recieved ?? new Date().toISOString().slice(0, 10),
      product_image: product.product_image,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.product_name.trim();
    if (!name) return;
    setError(null);
    setSuccess(null);

    const duplicate = products.find(
      (p) => p.product_id !== editingId && p.product_name.trim().toLowerCase() === name.toLowerCase()
    );
    if (duplicate) {
      setError(`มี "${name}" ในระบบอยู่แล้ว`);
      return;
    }

    setIsSaving(true);
    const patch = {
      product_name: name,
      category_id: form.category_id ? Number(form.category_id) : null,
      date_recieved: form.date_recieved,
      product_image: form.product_image,
    };

    const { error: saveErr } = editingId
      ? await supabase.from("products").update(patch).eq("product_id", editingId)
      : await supabase.from("products").insert({ ...patch, room_id: null, status_id: null });
    setIsSaving(false);

    if (saveErr) {
      setError(saveErr.message || "บันทึกไม่สำเร็จ");
      return;
    }
    setSuccess(editingId ? `บันทึก "${name}" แล้ว` : `เพิ่ม "${name}" เข้าสู่ระบบแล้ว`);
    resetForm();
    load();
  };

  const handleDelete = async (product: Product) => {
    const usedIn = roomAssets.filter((a) => a.product_id === product.product_id).length;
    const warning = usedIn > 0 ? `\nรายการนี้ถูกใช้งานอยู่ จะถูกนำออกจากห้องที่ใช้และประวัติแจ้งซ่อมที่เกี่ยวข้องจะถูกลบด้วย` : "";
    if (!confirm(`ยืนยันการลบ "${product.product_name}" ออกจากระบบ?${warning}`)) return;
    setError(null);
    setSuccess(null);
    const { error: assetErr } = await supabase.from("room_asset").delete().eq("product_id", product.product_id);
    if (assetErr) {
      setError(assetErr.message);
      return;
    }
    const { error: prodErr } = await supabase.from("products").delete().eq("product_id", product.product_id);
    if (prodErr) {
      setError(prodErr.message);
      return;
    }
    if (editingId === product.product_id) resetForm();
    load();
  };

  const categoryLabel = (id: number | null) => categories.find((c) => c.category_id === id)?.category_name ?? "ไม่ระบุหมวดหมู่";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.product_name.toLowerCase().includes(q));
  }, [products, query]);

  return (
    <div className="space-y-4 max-w-4xl mx-auto w-full">
      <div>
        <h2 className="sr-only">จัดการครุภัณฑ์</h2>
        <p className="text-xs text-slate-500">รายการครุภัณฑ์ทั้งหมดในระบบ เพิ่มหรือแก้ไขได้ที่นี่</p>
      </div>

      {error && (
        <div className="bg-red-50/80 backdrop-blur-md border border-red-200/60 text-red-600 text-sm rounded-xl px-4 py-2.5">{error}</div>
      )}
      {success && (
        <div className="bg-emerald-50/80 backdrop-blur-md border border-emerald-200/60 text-emerald-600 text-sm rounded-xl px-4 py-2.5">{success}</div>
      )}

      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-4 space-y-3">
        <p className="text-sm font-bold text-slate-700">{editingId ? "แก้ไขครุภัณฑ์" : "เพิ่มครุภัณฑ์เข้าสู่ระบบ"}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">ชื่อครุภัณฑ์</label>
            <input
              value={form.product_name}
              onChange={(e) => setForm((f) => ({ ...f, product_name: e.target.value }))}
              required
              placeholder="เช่น ตู้เย็น"
              className="glass-input px-3 py-2 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">หมวดหมู่</label>
            <select
              value={form.category_id}
              onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
              className="glass-input px-3 py-2 rounded-lg text-sm"
            >
              <option value="">-- เลือกหมวดหมู่ --</option>
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>
                  {c.category_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">วันที่รับเข้า</label>
            <input
              type="date"
              value={form.date_recieved}
              onChange={(e) => setForm((f) => ({ ...f, date_recieved: e.target.value }))}
              className="glass-input px-3 py-2 rounded-lg text-sm"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">รูปภาพ</label>
          <div className="max-w-xs">
            <ImageUpload
              bucket="productImage"
              pathPrefix="products"
              value={form.product_image}
              onChange={(url) => setForm((f) => ({ ...f, product_image: url }))}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button type="submit" disabled={isSaving} className="btn-primary px-4 py-2 rounded-lg text-sm flex items-center gap-1.5">
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : editingId ? <Check size={16} /> : <Plus size={16} />}
            {editingId ? "บันทึกการแก้ไข" : "เพิ่มครุภัณฑ์"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="btn-ghost px-4 py-2 rounded-lg text-sm">
              ยกเลิก
            </button>
          )}
        </div>
      </form>

      {!isLoading && products.length > 0 && (
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`ค้นหาครุภัณฑ์ (${products.length} รายการ)`}
            className="glass-input pl-9 pr-3 py-2 rounded-xl text-sm"
          />
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-brand-400" size={24} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm glass-card rounded-2xl">
          {products.length === 0 ? "ยังไม่มีครุภัณฑ์ในระบบ" : "ไม่พบครุภัณฑ์ที่ค้นหา"}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((p) => {
            return (
              <div
                key={p.product_id}
                className={`glass-card rounded-2xl p-3.5 flex items-center gap-3.5 ${editingId === p.product_id ? "ring-2 ring-brand-400" : ""}`}
              >
                <AssetAvatar imageUrl={p.product_image} name={p.product_name} />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 truncate">{p.product_name}</h4>
                  <p className="text-xs text-slate-400">{categoryLabel(p.category_id)}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => startEdit(p)} title="แก้ไข" className="p-2 rounded-lg bg-brand-100/70 text-brand-600 hover:bg-brand-100">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(p)} title="ลบออกจากระบบ" className="p-2 rounded-lg bg-red-100/70 text-red-500 hover:bg-red-100">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
