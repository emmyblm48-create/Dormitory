"use client";

import { useEffect, useState } from "react";
import { Pencil, Check, X, Loader2, UserPlus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Category, Room, Status, UserProfile } from "@/lib/types";

interface DefaultEquipmentItem {
  name: string;
  category: string;
}

const DEFAULT_EQUIPMENT: DefaultEquipmentItem[] = [
  { name: "เตียงนอน", category: "อุปกรณ์ทั่วไป" },
  { name: "ตู้เสื้อผ้า", category: "อุปกรณ์ทั่วไป" },
  { name: "โต๊ะทำงาน", category: "อุปกรณ์ทั่วไป" },
  { name: "เก้าอี้", category: "อุปกรณ์ทั่วไป" },
  { name: "ชั้นวางของ", category: "อุปกรณ์ทั่วไป" },
  { name: "ผ้าม่าน", category: "อุปกรณ์ทั่วไป" },
  { name: "ชักโครก", category: "อุปกรณ์ทั่วไป" },
  { name: "อ่างล้างหน้า", category: "อุปกรณ์ทั่วไป" },
  { name: "ที่ฉีดชำระ", category: "อุปกรณ์ทั่วไป" },
  { name: "พัดลม", category: "อุปกรณ์ไฟฟ้า" },
  { name: "เครื่องปรับอากาศ", category: "อุปกรณ์ไฟฟ้า" },
  { name: "เครื่องทำน้ำอุ่น", category: "อุปกรณ์ไฟฟ้า" },
  { name: "คัดเอาท์ไฟ", category: "อุปกรณ์ไฟฟ้า" },
];

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<UserProfile[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ userName: string; role: string }>({ userName: "", role: "user" });

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newFloor, setNewFloor] = useState("");
  const [newRentPrice, setNewRentPrice] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [selectedEquipment, setSelectedEquipment] = useState<Set<string>>(
    () => new Set(DEFAULT_EQUIPMENT.map((i) => i.name))
  );
  const [customEquipment, setCustomEquipment] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    const [t, r, c, s] = await Promise.all([
      supabase.from("user_extra").select("*").order("role"),
      supabase.from("rooms").select("*").order("room_number"),
      supabase.from("categories").select("*"),
      supabase.from("status").select("*").order("status_id"),
    ]);
    if (t.data) setTenants(t.data as UserProfile[]);
    if (r.data) setRooms(r.data as Room[]);
    if (c.data) setCategories(c.data as Category[]);
    if (s.data) setStatuses(s.data as Status[]);
    setIsLoading(false);
  };

  const toggleEquipment = (name: string) => {
    setSelectedEquipment((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const resolveOrCreateRoom = async (): Promise<{ room: Room | null; created: boolean; error: string | null }> => {
    const roomNumber = newUserName.trim();
    const existing = rooms.find((r) => r.room_number.toLowerCase() === roomNumber.toLowerCase());
    if (existing) return { room: existing, created: false, error: null };

    const { data, error } = await supabase
      .from("rooms")
      .insert({
        room_number: roomNumber,
        floor: newFloor.trim() || null,
        rent_price: Number(newRentPrice || 0),
      })
      .select()
      .single();
    if (error || !data) return { room: null, created: false, error: error?.message ?? "สร้างห้องไม่สำเร็จ" };
    return { room: data as Room, created: true, error: null };
  };

  const addRoomEquipment = async (roomId: number) => {
    const customNames = customEquipment
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const itemNames = [...DEFAULT_EQUIPMENT.filter((i) => selectedEquipment.has(i.name)).map((i) => i.name), ...customNames];
    if (itemNames.length === 0) return { added: 0, error: null as string | null };

    const defaultStatusId =
      statuses.find((s) => s.status_name === "สถานะปกติ")?.status_id ?? statuses[0]?.status_id;
    const today = new Date().toISOString().slice(0, 10);

    const productRows = itemNames.map((name) => {
      const preset = DEFAULT_EQUIPMENT.find((i) => i.name === name);
      const categoryId = preset ? categories.find((c) => c.category_name === preset.category)?.category_id ?? null : null;
      return {
        product_name: name,
        category_id: categoryId,
        room_id: roomId,
        status_id: defaultStatusId ?? null,
        date_recieved: today,
      };
    });

    const { data: newProducts, error: prodErr } = await supabase.from("products").insert(productRows).select();
    if (prodErr || !newProducts) return { added: 0, error: prodErr?.message ?? "เพิ่มครุภัณฑ์ไม่สำเร็จ" };

    const assetRows = newProducts.map((p) => ({
      product_id: p.product_id,
      room_id: roomId,
      status_id: defaultStatusId ?? null,
      date_add: today,
    }));
    const { error: assetErr } = await supabase.from("room_asset").insert(assetRows);
    if (assetErr) return { added: 0, error: assetErr.message };

    return { added: newProducts.length, error: null as string | null };
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (t: UserProfile) => {
    setEditingEmail(t.email);
    setEditValues({ userName: t.userName, role: t.role });
  };

  const saveEdit = async () => {
    if (!editingEmail) return;
    setError(null);
    const { error } = await supabase
      .from("user_extra")
      .update({ userName: editValues.userName, role: editValues.role })
      .eq("email", editingEmail);
    if (error) {
      setError(error.message);
      return;
    }
    setEditingEmail(null);
    load();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreateSuccess(null);
    if (!newEmail || !newPassword || !newUserName) return;
    setIsCreating(true);

    let roomResult: { room: Room | null; created: boolean; error: string | null } = {
      room: null,
      created: false,
      error: null,
    };
    if (newRole === "user") {
      roomResult = await resolveOrCreateRoom();
      if (roomResult.error) {
        setError(`สร้างห้องไม่สำเร็จ: ${roomResult.error}`);
        setIsCreating(false);
        return;
      }
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      setError("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
      setIsCreating(false);
      return;
    }

    const res = await fetch("/api/admin/create-tenant", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ email: newEmail, password: newPassword, userName: newUserName, role: newRole }),
    });
    const json = await res.json();
    setIsCreating(false);

    if (!res.ok) {
      setError(json.error || "สร้างบัญชีไม่สำเร็จ");
      return;
    }

    let successMessage = `สร้างบัญชีสำหรับ ${newEmail} สำเร็จ`;
    if (roomResult.created) successMessage += ` พร้อมสร้างห้อง ${newUserName.trim()} ใหม่`;
    if (roomResult.room) {
      const { added, error: equipmentError } = await addRoomEquipment(roomResult.room.room_id);
      if (equipmentError) {
        successMessage += ` (เพิ่มครุภัณฑ์ไม่สำเร็จ: ${equipmentError})`;
      } else if (added > 0) {
        successMessage += ` พร้อมเพิ่มครุภัณฑ์ ${added} รายการในห้อง`;
      }
    }

    setCreateSuccess(successMessage);
    setNewEmail("");
    setNewPassword("");
    setNewUserName("");
    setNewFloor("");
    setNewRentPrice("");
    setNewRole("user");
    setSelectedEquipment(new Set(DEFAULT_EQUIPMENT.map((i) => i.name)));
    setCustomEquipment("");
    load();
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto w-full">
      <h2 className="text-lg md:text-xl font-bold text-slate-900">จัดการบัญชีผู้เช่า</h2>

      {error && <div className="bg-red-50/80 backdrop-blur-md border border-red-200/60 text-red-600 text-sm rounded-xl px-4 py-2.5">{error}</div>}
      {createSuccess && <div className="bg-emerald-50/80 backdrop-blur-md border border-emerald-200/60 text-emerald-600 text-sm rounded-xl px-4 py-2.5">{createSuccess}</div>}

      <form onSubmit={handleCreate} className="glass-card rounded-2xl p-4 space-y-3">
        <p className="text-sm font-bold text-slate-700">สร้างบัญชีผู้เช่าใหม่</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">อีเมล</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              className="glass-input px-3 py-2 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">รหัสผ่านชั่วคราว</label>
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="glass-input px-3 py-2 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">เลขห้อง (userName)</label>
            <input
              list="room-list"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              required
              placeholder="เช่น A101"
              className="glass-input px-3 py-2 rounded-lg text-sm"
            />
            <datalist id="room-list">
              {rooms.map((r) => (
                <option key={r.room_id} value={r.room_number} />
              ))}
            </datalist>
            <p className="text-[10px] text-slate-400 mt-1">
              {rooms.some((r) => r.room_number.toLowerCase() === newUserName.trim().toLowerCase()) && newUserName.trim()
                ? "ห้องนี้มีอยู่แล้ว จะใช้ข้อมูลห้องเดิม"
                : "ถ้ายังไม่มีห้องนี้ในระบบ จะสร้างห้องใหม่ให้อัตโนมัติ"}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">บทบาท</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="glass-input px-3 py-2 rounded-lg text-sm"
            >
              <option value="user">ผู้เช่า (user)</option>
              <option value="admin">ผู้ดูแลระบบ (admin)</option>
            </select>
          </div>
          {newRole === "user" &&
            !rooms.some((r) => r.room_number.toLowerCase() === newUserName.trim().toLowerCase()) && (
              <>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">ชั้น (ห้องใหม่)</label>
                  <input
                    value={newFloor}
                    onChange={(e) => setNewFloor(e.target.value)}
                    placeholder="เช่น A1"
                    className="glass-input px-3 py-2 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">ค่าห้อง/เดือน (ห้องใหม่)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newRentPrice}
                    onChange={(e) => setNewRentPrice(e.target.value)}
                    className="glass-input px-3 py-2 rounded-lg text-sm"
                  />
                </div>
              </>
            )}
        </div>

        {newRole === "user" && (
          <div className="pt-1 border-t border-white/60">
            <p className="text-xs font-medium text-slate-500 mt-3 mb-2">
              ครุภัณฑ์ประจำห้อง (เลือกรายการที่จะเพิ่มให้ห้องนี้อัตโนมัติ)
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-1.5">
              {DEFAULT_EQUIPMENT.map((item) => (
                <label key={item.name} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={selectedEquipment.has(item.name)}
                    onChange={() => toggleEquipment(item.name)}
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  {item.name}
                </label>
              ))}
            </div>
            <div className="mt-2">
              <label className="text-xs font-medium text-slate-500 mb-1 block">รายการเพิ่มเติม (คั่นด้วย ,)</label>
              <input
                value={customEquipment}
                onChange={(e) => setCustomEquipment(e.target.value)}
                placeholder="เช่น กระจกเงา, ราวตากผ้า"
                className="glass-input px-3 py-2 rounded-lg text-sm"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isCreating}
          className="btn-primary px-4 py-2 rounded-lg text-sm flex items-center gap-1.5"
        >
          <UserPlus size={16} /> {isCreating ? "กำลังสร้าง..." : "สร้างบัญชี"}
        </button>
      </form>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-brand-400" size={24} />
        </div>
      ) : (
        <div className="glass-card rounded-2xl divide-y divide-white/50">
          {tenants.map((t) => {
            const isEditing = editingEmail === t.email;
            return (
              <div key={t.email} className="p-3.5 flex flex-col md:flex-row md:items-center gap-2">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <span className="text-sm text-slate-500">{t.email}</span>
                  {isEditing ? (
                    <input
                      value={editValues.userName}
                      onChange={(e) => setEditValues((v) => ({ ...v, userName: e.target.value }))}
                      className="glass-input px-2.5 py-1.5 rounded-lg text-sm"
                    />
                  ) : (
                    <span className="text-sm font-medium text-slate-800">{t.userName}</span>
                  )}
                  {isEditing ? (
                    <select
                      value={editValues.role}
                      onChange={(e) => setEditValues((v) => ({ ...v, role: e.target.value }))}
                      className="glass-input px-2.5 py-1.5 rounded-lg text-sm"
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  ) : (
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full w-fit ${t.role === "admin" ? "bg-amber-100/80 text-amber-700" : "bg-brand-100/80 text-brand-600"}`}>
                      {t.role}
                    </span>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  {isEditing ? (
                    <>
                      <button onClick={saveEdit} className="p-2 rounded-lg bg-emerald-100/70 text-emerald-600 hover:bg-emerald-100">
                        <Check size={16} />
                      </button>
                      <button onClick={() => setEditingEmail(null)} className="p-2 rounded-lg bg-white/60 text-slate-500 hover:bg-white/90">
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <button onClick={() => startEdit(t)} className="p-2 rounded-lg bg-brand-100/70 text-brand-600 hover:bg-brand-100">
                      <Pencil size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
