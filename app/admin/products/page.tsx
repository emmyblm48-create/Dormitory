"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus, Loader2, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ImageUpload } from "@/components/ImageUpload";
import { AssetAvatar } from "@/components/AssetAvatar";
import type { Room, Category, Status, Product, RoomAsset } from "@/lib/types";

interface FormState {
  product_name: string;
  category_id: string;
  room_id: string;
  status_id: string;
  date_recieved: string;
  product_image: string | null;
}

const emptyForm: FormState = {
  product_name: "",
  category_id: "",
  room_id: "",
  status_id: "",
  date_recieved: new Date().toISOString().slice(0, 10),
  product_image: null,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [roomAssets, setRoomAssets] = useState<RoomAsset[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = async () => {
    setIsLoading(true);
    const [p, ra, r, c, s] = await Promise.all([
      supabase.from("products").select("*").order("product_id", { ascending: false }),
      supabase.from("room_asset").select("*"),
      supabase.from("rooms").select("*").order("room_number"),
      supabase.from("categories").select("*").order("category_name"),
      supabase.from("status").select("*").order("status_id"),
    ]);
    if (p.data) setProducts(p.data as Product[]);
    if (ra.data) setRoomAssets(ra.data as RoomAsset[]);
    if (r.data) setRooms(r.data as Room[]);
    if (c.data) setCategories(c.data as Category[]);
    if (s.data) setStatuses(s.data as Status[]);
    setIsLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const startEdit = (product: Product) => {
    const asset = roomAssets.find((a) => a.product_id === product.product_id);
    setEditingId(product.product_id);
    setForm({
      product_name: product.product_name,
      category_id: String(product.category_id ?? ""),
      room_id: String(asset?.room_id ?? product.room_id ?? ""),
      status_id: String(asset?.status_id ?? product.status_id ?? ""),
      date_recieved: product.date_recieved ?? new Date().toISOString().slice(0, 10),
      product_image: product.product_image,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.product_name.trim() || !form.room_id || !form.status_id) return;
    setError(null);
    setIsSaving(true);

    const productPatch = {
      product_name: form.product_name.trim(),
      category_id: form.category_id ? Number(form.category_id) : null,
      room_id: Number(form.room_id),
      status_id: Number(form.status_id),
      date_recieved: form.date_recieved,
      product_image: form.product_image,
    };

    try {
      if (editingId) {
        const { error: updErr } = await supabase.from("products").update(productPatch).eq("product_id", editingId);
        if (updErr) throw updErr;

        const existingAsset = roomAssets.find((a) => a.product_id === editingId);
        if (existingAsset) {
          const { error: assetErr } = await supabase
            .from("room_asset")
            .update({ room_id: productPatch.room_id, status_id: productPatch.status_id, date_add: form.date_recieved })
            .eq("asset_id", existingAsset.asset_id);
          if (assetErr) throw assetErr;
        } else {
          const { error: assetErr } = await supabase.from("room_asset").insert({
            product_id: editingId,
            room_id: productPatch.room_id,
            status_id: productPatch.status_id,
            date_add: form.date_recieved,
          });
          if (assetErr) throw assetErr;
        }
      } else {
        const { data: newProduct, error: insErr } = await supabase
          .from("products")
          .insert(productPatch)
          .select()
          .single();
        if (insErr) throw insErr;

        const { error: assetErr } = await supabase.from("room_asset").insert({
          product_id: newProduct.product_id,
          room_id: productPatch.room_id,
          status_id: productPatch.status_id,
          date_add: form.date_recieved,
        });
        if (assetErr) throw assetErr;
      }

      resetForm();
      load();
    } catch (err: any) {
      setError(err.message || "บันทึกไม่สำเร็จ");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (productId: number) => {
    if (!confirm("ยืนยันการลบครุภัณฑ์นี้?")) return;
    setError(null);
    const { error: assetErr } = await supabase.from("room_asset").delete().eq("product_id", productId);
    if (assetErr) {
      setError(assetErr.message);
      return;
    }
    const { error: prodErr } = await supabase.from("products").delete().eq("product_id", productId);
    if (prodErr) {
      setError("ไม่สามารถลบได้ อาจมีประวัติแจ้งซ่อมของครุภัณฑ์นี้อยู่: " + prodErr.message);
      return;
    }
    load();
  };

  const roomLabel = (id: number | null) => rooms.find((r) => r.room_id === id)?.room_number ?? "-";
  const statusLabel = (id: number | null) => statuses.find((s) => s.status_id === id)?.status_name ?? "-";

  return (
    <div className="space-y-4 max-w-4xl mx-auto w-full">
      <h2 className="text-lg md:text-xl font-bold text-slate-900">จัดการครุภัณฑ์</h2>

      {error && (
        <div className="bg-red-50/80 backdrop-blur-md border border-red-200/60 text-red-600 text-sm rounded-xl px-4 py-2.5">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-4 space-y-3">
        <p className="text-sm font-bold text-slate-700">{editingId ? "แก้ไขครุภัณฑ์" : "เพิ่มครุภัณฑ์ใหม่"}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">ชื่อครุภัณฑ์</label>
            <input
              value={form.product_name}
              onChange={(e) => setForm((f) => ({ ...f, product_name: e.target.value }))}
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
            <label className="text-xs font-medium text-slate-500 mb-1 block">ห้องพัก</label>
            <select
              value={form.room_id}
              onChange={(e) => setForm((f) => ({ ...f, room_id: e.target.value }))}
              required
              className="glass-input px-3 py-2 rounded-lg text-sm"
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
            <label className="text-xs font-medium text-slate-500 mb-1 block">สถานะ</label>
            <select
              value={form.status_id}
              onChange={(e) => setForm((f) => ({ ...f, status_id: e.target.value }))}
              required
              className="glass-input px-3 py-2 rounded-lg text-sm"
            >
              <option value="">-- เลือกสถานะ --</option>
              {statuses.map((s) => (
                <option key={s.status_id} value={s.status_id}>
                  {s.status_name}
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
          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary px-4 py-2 rounded-lg text-sm flex items-center gap-1.5"
          >
            {editingId ? <Check size={16} /> : <Plus size={16} />}
            {editingId ? "บันทึกการแก้ไข" : "เพิ่มครุภัณฑ์"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="btn-ghost px-4 py-2 rounded-lg text-sm">
              ยกเลิก
            </button>
          )}
        </div>
      </form>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-brand-400" size={24} />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm glass-card rounded-2xl">
          ยังไม่มีครุภัณฑ์
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((p) => {
            const asset = roomAssets.find((a) => a.product_id === p.product_id);
            return (
              <div key={p.product_id} className="glass-card rounded-2xl p-3.5 flex items-center gap-3.5">
                <AssetAvatar imageUrl={p.product_image} name={p.product_name} />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 truncate">{p.product_name}</h4>
                  <p className="text-xs text-slate-400">
                    ห้อง {roomLabel(asset?.room_id ?? p.room_id)} · {statusLabel(asset?.status_id ?? p.status_id)}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => startEdit(p)} className="p-2 rounded-lg bg-brand-100/70 text-brand-600 hover:bg-brand-100">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(p.product_id)} className="p-2 rounded-lg bg-red-100/70 text-red-500 hover:bg-red-100">
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
