"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight, DoorOpen, Eye, EyeOff, Loader2, Plus, Search, ShieldCheck, Shuffle, UserPlus, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { formatCurrency } from "@/lib/format";
import { RoomDetailModal } from "@/components/admin/RoomDetailModal";
import { TenantAccountRow } from "@/components/admin/TenantAccountRow";
import {
  DEFAULT_EQUIPMENT,
  addRoomEquipment,
  assetStatusDotClass,
  callAdminApi,
  generatePassword,
  sameRoom,
  shortStatus,
  type RoomAssetDetail,
} from "@/lib/tenant-admin";
import type { Category, Room, Status, UserProfile } from "@/lib/types";

type Notice = { type: "error" | "success"; text: string } | null;
type CreateMode = "tenant" | "admin";

const emptyForm = { roomNumber: "", floor: "", rentPrice: "", email: "", password: "", adminName: "" };

export default function AdminTenantsPage() {
  const { session } = useAuth();
  const sessionEmail = session?.user?.email ?? null;

  const [tenants, setTenants] = useState<UserProfile[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [assets, setAssets] = useState<RoomAssetDetail[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState<Notice>(null);

  const [query, setQuery] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  // Passwords the admin set during this visit. Supabase stores only hashes, so
  // this is the only way to show a password back; it is never persisted.
  const [knownPasswords, setKnownPasswords] = useState<Record<string, string>>({});

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [mode, setMode] = useState<CreateMode>("tenant");
  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(true);
  const [selectedEquipment, setSelectedEquipment] = useState<Set<string>>(() => new Set(DEFAULT_EQUIPMENT.map((i) => i.name)));
  const [customEquipment, setCustomEquipment] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const load = useCallback(async (showSpinner = false) => {
    if (showSpinner) setIsLoading(true);
    const [t, r, a, c, s] = await Promise.all([
      supabase.from("user_extra").select("*").order("email"),
      supabase.from("rooms").select("*").order("room_number"),
      supabase.from("room_asset").select("asset_id, room_id, product_id, status_id, products(product_name, product_image)").order("asset_id"),
      supabase.from("categories").select("*"),
      supabase.from("status").select("*").order("status_id"),
    ]);
    if (t.data) setTenants(t.data as UserProfile[]);
    if (r.data) setRooms(r.data as Room[]);
    if (a.data) setAssets(a.data as unknown as RoomAssetDetail[]);
    if (c.data) setCategories(c.data as Category[]);
    if (s.data) setStatuses(s.data as Status[]);
    const firstError = [t, r, a, c, s].find((res) => res.error)?.error;
    if (firstError) setNotice({ type: "error", text: firstError.message });
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load(true);
  }, [load]);

  const refresh = useCallback(() => load(), [load]);
  const closeModal = useCallback(() => setSelectedRoomId(null), []);

  const rememberPassword = useCallback((email: string, password: string) => {
    setKnownPasswords((prev) => ({ ...prev, [email.toLowerCase()]: password }));
  }, []);

  const statusName = (id: number | null) => statuses.find((s) => s.status_id === id)?.status_name ?? null;
  const accountsForRoom = (room: Room) => tenants.filter((t) => sameRoom(t.userName, room.room_number));
  const assetsForRoom = (roomId: number) => assets.filter((a) => a.room_id === roomId);

  const unlinkedAccounts = useMemo(
    () => tenants.filter((t) => !rooms.some((r) => sameRoom(t.userName, r.room_number))),
    [tenants, rooms]
  );

  const filteredRooms = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rooms;
    return rooms.filter(
      (r) =>
        r.room_number.toLowerCase().includes(q) ||
        (r.floor ?? "").toLowerCase().includes(q) ||
        tenants.some((t) => sameRoom(t.userName, r.room_number) && t.email.toLowerCase().includes(q))
    );
  }, [rooms, tenants, query]);

  const selectedRoom = rooms.find((r) => r.room_id === selectedRoomId) ?? null;
  const roomExists = mode === "tenant" && !!form.roomNumber.trim() && rooms.some((r) => sameRoom(r.room_number, form.roomNumber));

  const openForm = () => {
    setIsFormOpen(true);
    setForm((f) => ({ ...f, password: f.password || generatePassword() }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setSelectedEquipment(new Set(DEFAULT_EQUIPMENT.map((i) => i.name)));
    setCustomEquipment("");
    setMode("tenant");
  };

  const toggleEquipment = (name: string) => {
    setSelectedEquipment((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    const email = form.email.trim();
    if (!email || form.password.length < 6) {
      setNotice({ type: "error", text: "กรุณากรอกอีเมลและรหัสผ่านอย่างน้อย 6 ตัวอักษร" });
      return;
    }

    if (mode === "admin") {
      const name = form.adminName.trim() || email.split("@")[0];
      setIsCreating(true);
      const { ok, error } = await callAdminApi("/api/admin/create-tenant", { email, password: form.password, userName: name, role: "admin" });
      setIsCreating(false);
      if (!ok) return setNotice({ type: "error", text: error || "สร้างบัญชีไม่สำเร็จ" });
      rememberPassword(email, form.password);
      setNotice({ type: "success", text: `สร้างบัญชีผู้ดูแลระบบ ${email} แล้ว` });
      resetForm();
      setIsFormOpen(false);
      load();
      return;
    }

    const roomNumber = form.roomNumber.trim();
    if (!roomNumber) return setNotice({ type: "error", text: "กรุณากรอกเลขห้อง" });
    if (roomExists) return setNotice({ type: "error", text: `ห้อง ${roomNumber} มีอยู่แล้ว เปิดการ์ดของห้องเพื่อเพิ่มบัญชีแทน` });

    setIsCreating(true);
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .insert({ room_number: roomNumber, floor: form.floor.trim() || null, rent_price: Number(form.rentPrice || 0) })
      .select()
      .single();
    if (roomError || !room) {
      setIsCreating(false);
      return setNotice({ type: "error", text: `สร้างห้องไม่สำเร็จ: ${roomError?.message ?? ""}` });
    }

    const { ok, error } = await callAdminApi("/api/admin/create-tenant", { email, password: form.password, userName: roomNumber, role: "user" });
    if (!ok) {
      // Room and account are created as one unit — undo the room if the account failed
      await supabase.from("rooms").delete().eq("room_id", room.room_id);
      setIsCreating(false);
      return setNotice({ type: "error", text: error || "สร้างบัญชีไม่สำเร็จ" });
    }
    rememberPassword(email, form.password);

    const customNames = customEquipment
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const itemNames = [...DEFAULT_EQUIPMENT.filter((i) => selectedEquipment.has(i.name)).map((i) => i.name), ...customNames];
    const { added, error: equipmentError } = await addRoomEquipment(room.room_id, itemNames, categories, statuses);
    setIsCreating(false);

    let text = `สร้างห้อง ${roomNumber} พร้อมบัญชี ${email} แล้ว`;
    if (equipmentError) text += ` (เพิ่มครุภัณฑ์ไม่สำเร็จ: ${equipmentError})`;
    else if (added > 0) text += ` และครุภัณฑ์ ${added} รายการ`;
    setNotice({ type: equipmentError ? "error" : "success", text });

    resetForm();
    setIsFormOpen(false);
    await load();
    setSelectedRoomId(room.room_id);
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <h2 className="text-lg md:text-xl font-bold text-slate-900 flex-1">จัดการห้องพักและผู้เช่า</h2>
        {!isFormOpen && (
          <button onClick={openForm} className="btn-primary px-4 py-2 rounded-xl text-sm flex items-center justify-center gap-1.5">
            <Plus size={16} /> เพิ่มห้องพัก + บัญชี
          </button>
        )}
      </div>

      {notice && (
        <div
          className={`backdrop-blur-md text-sm rounded-xl px-4 py-2.5 border flex items-start gap-2 ${
            notice.type === "error" ? "bg-red-50/80 border-red-200/60 text-red-600" : "bg-emerald-50/80 border-emerald-200/60 text-emerald-600"
          }`}
        >
          <span className="flex-1">{notice.text}</span>
          <button onClick={() => setNotice(null)} aria-label="ปิดข้อความ" className="opacity-60 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      )}

      {isFormOpen && (
        <form onSubmit={handleCreate} className="glass-card rounded-2xl p-4 md:p-5 space-y-4">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-slate-700 flex-1">
              {mode === "tenant" ? "เพิ่มห้องพักพร้อมบัญชีผู้เช่า" : "เพิ่มบัญชีผู้ดูแลระบบ"}
            </p>
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                resetForm();
              }}
              aria-label="ปิดฟอร์ม"
              className="p-1.5 rounded-lg text-slate-400 hover:bg-white"
            >
              <X size={16} />
            </button>
          </div>

          <div className="inline-flex rounded-xl bg-white/60 border border-brand-100 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMode("tenant")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${mode === "tenant" ? "bg-brand-600 text-white" : "text-slate-500"}`}
            >
              <DoorOpen size={14} /> ห้องพัก + ผู้เช่า
            </button>
            <button
              type="button"
              onClick={() => setMode("admin")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${mode === "admin" ? "bg-amber-500 text-white" : "text-slate-500"}`}
            >
              <ShieldCheck size={14} /> ผู้ดูแลระบบ
            </button>
          </div>

          {mode === "tenant" && (
            <fieldset className="space-y-2">
              <legend className="text-xs font-bold text-brand-700 mb-2">1. ข้อมูลห้อง</legend>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">เลขห้อง</label>
                  <input
                    value={form.roomNumber}
                    onChange={(e) => setForm((f) => ({ ...f, roomNumber: e.target.value }))}
                    required
                    placeholder="เช่น A101"
                    className="glass-input px-3 py-2 rounded-lg text-sm"
                  />
                  {roomExists && <p className="text-[11px] text-red-500 mt-1">ห้องนี้มีอยู่แล้ว เพิ่มบัญชีจากการ์ดของห้องได้เลย</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">ชั้น</label>
                  <input
                    value={form.floor}
                    onChange={(e) => setForm((f) => ({ ...f, floor: e.target.value }))}
                    placeholder="เช่น 1"
                    className="glass-input px-3 py-2 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">ค่าเช่า/เดือน (บาท)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.rentPrice}
                    onChange={(e) => setForm((f) => ({ ...f, rentPrice: e.target.value }))}
                    className="glass-input px-3 py-2 rounded-lg text-sm"
                  />
                </div>
              </div>
            </fieldset>
          )}

          <fieldset className="space-y-2">
            <legend className="text-xs font-bold text-brand-700 mb-2">{mode === "tenant" ? "2. บัญชีผู้เช่า" : "ข้อมูลบัญชี"}</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">อีเมล</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                  className="glass-input px-3 py-2 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">รหัสผ่าน</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    required
                    minLength={6}
                    className="glass-input pl-3 pr-16 py-2 rounded-lg text-sm font-mono"
                  />
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex">
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, password: generatePassword() }))}
                      title="สุ่มรหัสผ่าน"
                      className="p-1.5 rounded-md text-slate-500 hover:bg-brand-50"
                    >
                      <Shuffle size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      title={showPassword ? "ซ่อน" : "แสดง"}
                      className="p-1.5 rounded-md text-slate-500 hover:bg-brand-50"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>
              {mode === "admin" && (
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-slate-500 mb-1 block">ชื่อที่แสดง</label>
                  <input
                    value={form.adminName}
                    onChange={(e) => setForm((f) => ({ ...f, adminName: e.target.value }))}
                    placeholder="เช่น admin"
                    className="glass-input px-3 py-2 rounded-lg text-sm"
                  />
                </div>
              )}
            </div>
          </fieldset>

          {mode === "tenant" && (
            <fieldset>
              <legend className="text-xs font-bold text-brand-700 mb-2">3. ครุภัณฑ์ประจำห้อง</legend>
              <div className="flex flex-wrap gap-1.5">
                {DEFAULT_EQUIPMENT.map((item) => {
                  const checked = selectedEquipment.has(item.name);
                  return (
                    <button
                      type="button"
                      key={item.name}
                      onClick={() => toggleEquipment(item.name)}
                      aria-pressed={checked}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                        checked ? "bg-brand-600 border-brand-600 text-white" : "bg-white/60 border-brand-100 text-slate-500 hover:bg-white"
                      }`}
                    >
                      {item.name}
                    </button>
                  );
                })}
              </div>
              <input
                value={customEquipment}
                onChange={(e) => setCustomEquipment(e.target.value)}
                placeholder="รายการเพิ่มเติม คั่นด้วย , เช่น กระจกเงา, ราวตากผ้า"
                className="glass-input px-3 py-2 rounded-lg text-sm mt-2"
              />
            </fieldset>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isCreating || roomExists}
              className="btn-primary px-5 py-2 rounded-xl text-sm flex items-center gap-1.5"
            >
              {isCreating ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
              {isCreating ? "กำลังสร้าง..." : mode === "tenant" ? "สร้างห้องและบัญชี" : "สร้างบัญชี"}
            </button>
          </div>
        </form>
      )}

      {!isLoading && rooms.length > 0 && (
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาเลขห้อง ชั้น หรืออีเมล"
            className="glass-input pl-9 pr-3 py-2 rounded-xl text-sm"
          />
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-brand-400" size={24} />
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-10 text-slate-400 text-sm glass-card rounded-2xl">ยังไม่มีห้องพัก กด “เพิ่มห้องพัก + บัญชี” เพื่อเริ่มต้น</div>
      ) : filteredRooms.length === 0 ? (
        <div className="text-center py-10 text-slate-400 text-sm glass-card rounded-2xl">ไม่พบห้องที่ค้นหา</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredRooms.map((room) => {
            const roomAccounts = accountsForRoom(room);
            const roomAssets = assetsForRoom(room.room_id);
            const brokenCount = roomAssets.filter((a) => statusName(a.status_id) === "สถานะแจ้งซ่อม").length;
            return (
              <button
                key={room.room_id}
                onClick={() => setSelectedRoomId(room.room_id)}
                className="glass-card rounded-2xl p-4 text-left flex flex-col gap-3 transition-all hover:-translate-y-0.5 hover:shadow-glass-lg hover:border-brand-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center shrink-0">
                    <DoorOpen size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold text-slate-900 leading-tight truncate">{room.room_number}</p>
                    <p className="text-xs text-slate-400">ชั้น {room.floor || "-"}</p>
                  </div>
                  <ChevronRight size={18} className="text-slate-300 mt-1 shrink-0" />
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-400">ค่าเช่า/เดือน</span>
                  <span className="text-base font-bold text-brand-700">{formatCurrency(room.rent_price)}</span>
                </div>

                <div className="space-y-1">
                  {roomAccounts.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">ยังไม่มีบัญชีผู้เช่า</p>
                  ) : (
                    roomAccounts.map((a) => (
                      <div key={a.email} className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-slate-600 truncate flex-1">{a.email}</span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                            a.role === "admin" ? "bg-amber-100/80 text-amber-700" : "bg-brand-100/80 text-brand-600"
                          }`}
                        >
                          {a.role}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-2.5 border-t border-brand-100/70 flex items-center gap-2">
                  <span className="text-xs text-slate-500 shrink-0">ครุภัณฑ์ {roomAssets.length}</span>
                  <div className="flex flex-wrap gap-0.5 flex-1">
                    {roomAssets.map((a) => (
                      <span
                        key={a.asset_id}
                        title={`${a.products?.product_name ?? ""} · ${shortStatus(statusName(a.status_id))}`}
                        className={`w-2 h-2 rounded-full ${assetStatusDotClass(statusName(a.status_id))}`}
                      />
                    ))}
                  </div>
                  {brokenCount > 0 && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100/80 text-red-600 shrink-0">
                      แจ้งซ่อม {brokenCount}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {!isLoading && unlinkedAccounts.length > 0 && (
        <section className="space-y-2 pt-2">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-amber-500" /> บัญชีที่ไม่ได้ผูกกับห้อง (ผู้ดูแลระบบ ฯลฯ)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {unlinkedAccounts.map((a) => (
              <TenantAccountRow
                key={a.email}
                account={a}
                isSelf={a.email.toLowerCase() === sessionEmail?.toLowerCase()}
                knownPassword={knownPasswords[a.email.toLowerCase()]}
                onPasswordSet={rememberPassword}
                onChanged={refresh}
                onError={(text) => setNotice({ type: "error", text })}
                onSuccess={(text) => setNotice({ type: "success", text })}
              />
            ))}
          </div>
        </section>
      )}

      {selectedRoom && (
        <RoomDetailModal
          key={selectedRoom.room_id}
          room={selectedRoom}
          accounts={accountsForRoom(selectedRoom)}
          assets={assetsForRoom(selectedRoom.room_id)}
          statuses={statuses}
          categories={categories}
          sessionEmail={sessionEmail}
          knownPasswords={knownPasswords}
          onPasswordSet={rememberPassword}
          onChanged={refresh}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
