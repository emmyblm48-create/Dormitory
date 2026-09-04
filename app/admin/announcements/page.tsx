"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus, Loader2, Check, Pin } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ImageUpload } from "@/components/ImageUpload";
import type { Announcement } from "@/lib/types";

const CATEGORIES = ["ข่าวสารทั่วไป", "ข่าวสารภายในหอพัก", "กฎระเบียบ", "ประกาศ"];

interface FormState {
  title: string;
  content: string;
  category: string;
  image_path: string | null;
  is_pinned: boolean;
}

const emptyForm: FormState = {
  title: "",
  content: "",
  category: CATEGORIES[0],
  image_path: null,
  is_pinned: false,
};

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });
    if (!error && data) setAnnouncements(data as Announcement[]);
    setIsLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const startEdit = (a: Announcement) => {
    setEditingId(a.announcement_id);
    setForm({
      title: a.title,
      content: a.content,
      category: a.category,
      image_path: a.image_path,
      is_pinned: a.is_pinned,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    setError(null);
    setIsSaving(true);

    const patch = {
      title: form.title.trim(),
      content: form.content.trim(),
      category: form.category,
      image_path: form.image_path,
      is_pinned: form.is_pinned,
      updated_at: new Date().toISOString(),
    };

    try {
      if (editingId) {
        const { error: updErr } = await supabase.from("announcements").update(patch).eq("announcement_id", editingId);
        if (updErr) throw updErr;
      } else {
        const { error: insErr } = await supabase.from("announcements").insert(patch);
        if (insErr) throw insErr;
      }
      resetForm();
      load();
    } catch (err: any) {
      setError(err.message || "บันทึกไม่สำเร็จ");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("ยืนยันการลบข่าวประชาสัมพันธ์นี้?")) return;
    setError(null);
    const { error } = await supabase.from("announcements").delete().eq("announcement_id", id);
    if (error) {
      setError(error.message);
      return;
    }
    load();
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto w-full">
      <h2 className="text-lg md:text-xl font-bold text-slate-900">จัดการข่าวสารประชาสัมพันธ์</h2>

      {error && (
        <div className="bg-red-50/80 backdrop-blur-md border border-red-200/60 text-red-600 text-sm rounded-xl px-4 py-2.5">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-4 space-y-3">
        <p className="text-sm font-bold text-slate-700">{editingId ? "แก้ไขข่าวประชาสัมพันธ์" : "เพิ่มข่าวประชาสัมพันธ์ใหม่"}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">หัวข้อข่าว</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="glass-input px-3 py-2 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">หมวดหมู่</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="glass-input px-3 py-2 rounded-lg text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">เนื้อหา</label>
          <textarea
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            rows={4}
            className="glass-input px-3 py-2 rounded-lg text-sm w-full"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">รูปภาพประกอบ (ถ้ามี)</label>
          <div className="max-w-xs">
            <ImageUpload
              bucket="announcementImage"
              pathPrefix="announcements"
              value={form.image_path}
              onChange={(url) => setForm((f) => ({ ...f, image_path: url }))}
              cameraCapture={false}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={form.is_pinned}
            onChange={(e) => setForm((f) => ({ ...f, is_pinned: e.target.checked }))}
            className="w-4 h-4 rounded accent-brand-600"
          />
          ปักหมุดข่าวนี้ไว้บนสุด
        </label>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary px-4 py-2 rounded-lg text-sm flex items-center gap-1.5"
          >
            {editingId ? <Check size={16} /> : <Plus size={16} />}
            {editingId ? "บันทึกการแก้ไข" : "เพิ่มข่าว"}
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
      ) : announcements.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm glass-card rounded-2xl">
          ยังไม่มีข่าวประชาสัมพันธ์
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a.announcement_id} className="glass-card rounded-2xl p-3.5 flex items-start gap-3.5">
              {a.image_path && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.image_path} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {a.is_pinned && <Pin size={14} className="text-amber-500 shrink-0" />}
                  <h4 className="font-bold text-slate-900 truncate">{a.title}</h4>
                </div>
                <p className="text-xs text-slate-400 mb-1">
                  {a.category} · {new Date(a.created_at).toLocaleDateString("th-TH")}
                </p>
                <p className="text-sm text-slate-600 line-clamp-2">{a.content}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => startEdit(a)} className="p-2 rounded-lg bg-brand-100/70 text-brand-600 hover:bg-brand-100">
                  <Pencil size={16} />
                </button>
                <button onClick={() => handleDelete(a.announcement_id)} className="p-2 rounded-lg bg-red-100/70 text-red-500 hover:bg-red-100">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
