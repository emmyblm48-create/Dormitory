"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, DoorOpen, Eye, EyeOff, Loader2, Package, Pencil, Plus, Shuffle, Trash2, UserPlus, Users, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/format";
import { AssetAvatar } from "@/components/AssetAvatar";
import { TenantAccountRow } from "@/components/admin/TenantAccountRow";
import {
  addRoomEquipment,
  assetStatusChipClass,
  callAdminApi,
  generatePassword,
  shortStatus,
  type RoomAssetDetail,
} from "@/lib/tenant-admin";
import type { Category, Room, Status, UserProfile } from "@/lib/types";

interface Props {
  room: Room;
  accounts: UserProfile[];
  assets: RoomAssetDetail[];
  statuses: Status[];
  categories: Category[];
  sessionEmail?: string | null;
  knownPasswords: Record<string, string>;
  onPasswordSet: (email: string, password: string) => void;
  onChanged: () => void;
  onClose: () => void;
}

type Notice = { type: "error" | "success"; text: string } | null;

export function RoomDetailModal({
  room,
  accounts,
  assets,
  statuses,
  categories,
  sessionEmail,
  knownPasswords,
  onPasswordSet,
  onChanged,
  onClose,
}: Props) {
  const [notice, setNotice] = useState<Notice>(null);

  const [isEditingRoom, setIsEditingRoom] = useState(false);
  const [roomValues, setRoomValues] = useState({ room_number: "", floor: "", rent_price: "" });
  const [isSavingRoom, setIsSavingRoom] = useState(false);
  const [isDeletingRoom, setIsDeletingRoom] = useState(false);

  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(true);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  const [newItem, setNewItem] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [busyAssetId, setBusyAssetId] = useState<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const statusName = (id: number | null) => statuses.find((s) => s.status_id === id)?.status_name ?? null;

  const statusSummary = useMemo(() => {
    const counts = new Map<string, number>();
    assets.forEach((a) => {
      const name = statusName(a.status_id) ?? "ไม่ระบุ";
      counts.set(name, (counts.get(name) ?? 0) + 1);
    });
    return Array.from(counts.entries());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets, statuses]);

  const fail = (text: string) => setNotice({ type: "error", text });
  const ok = (text: string) => setNotice({ type: "success", text });

  const startRoomEdit = () => {
    setRoomValues({ room_number: room.room_number, floor: room.floor ?? "", rent_price: String(room.rent_price ?? "") });
    setIsEditingRoom(true);
  };

  const saveRoom = async () => {
    const roomNumber = roomValues.room_number.trim();
    if (!roomNumber) return fail("กรุณากรอกเลขห้อง");
    setIsSavingRoom(true);
    const { error } = await supabase
      .from("rooms")
      .update({ room_number: roomNumber, floor: roomValues.floor.trim() || null, rent_price: Number(roomValues.rent_price || 0) })
      .eq("room_id", room.room_id);
    if (error) {
      setIsSavingRoom(false);
      return fail(error.message);
    }
    // Accounts are linked to their room by userName, so keep them in sync on rename
    if (roomNumber !== room.room_number && accounts.length > 0) {
      const { error: accErr } = await supabase
        .from("user_extra")
        .update({ userName: roomNumber })
        .in("email", accounts.map((a) => a.email));
      if (accErr) {
        setIsSavingRoom(false);
        return fail(`บันทึกห้องแล้ว แต่ย้ายบัญชีไม่สำเร็จ: ${accErr.message}`);
      }
    }
    setIsSavingRoom(false);
    setIsEditingRoom(false);
    ok("บันทึกข้อมูลห้องแล้ว");
    onChanged();
  };

  const deleteRoom = async () => {
    const accountNote = accounts.length > 0 ? `\nบัญชีที่ผูกกับห้องนี้ (${accounts.length} บัญชี) จะถูกลบด้วย` : "";
    if (!confirm(`ยืนยันการลบห้อง ${room.room_number}?\nครุภัณฑ์และประวัติแจ้งซ่อมของห้องนี้จะถูกลบทั้งหมด${accountNote}`)) return;
    setIsDeletingRoom(true);
    for (const account of accounts) {
      if (account.email.toLowerCase() === sessionEmail?.toLowerCase()) continue;
      const { ok: deleted, error } = await callAdminApi("/api/admin/delete-tenant", { email: account.email });
      if (!deleted) {
        setIsDeletingRoom(false);
        return fail(`ลบบัญชี ${account.email} ไม่สำเร็จ: ${error}`);
      }
    }
    const { error } = await supabase.from("rooms").delete().eq("room_id", room.room_id);
    setIsDeletingRoom(false);
    if (error) return fail(error.message);
    onChanged();
    onClose();
  };

  const createAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || newPassword.length < 6) return fail("กรุณากรอกอีเมลและรหัสผ่านอย่างน้อย 6 ตัวอักษร");
    setIsCreatingAccount(true);
    const email = newEmail.trim();
    const { ok: created, error } = await callAdminApi("/api/admin/create-tenant", {
      email,
      password: newPassword,
      userName: room.room_number,
      role: "user",
    });
    setIsCreatingAccount(false);
    if (!created) return fail(error || "สร้างบัญชีไม่สำเร็จ");
    onPasswordSet(email, newPassword);
    ok(`สร้างบัญชี ${email} ให้ห้อง ${room.room_number} แล้ว`);
    setNewEmail("");
    setNewPassword("");
    setShowAddAccount(false);
    onChanged();
  };

  const changeAssetStatus = async (asset: RoomAssetDetail, statusId: number) => {
    setBusyAssetId(asset.asset_id);
    const { error } = await supabase.from("room_asset").update({ status_id: statusId }).eq("asset_id", asset.asset_id);
    if (!error && asset.product_id) {
      await supabase.from("products").update({ status_id: statusId }).eq("product_id", asset.product_id);
    }
    setBusyAssetId(null);
    if (error) return fail(error.message);
    onChanged();
  };

  const deleteAsset = async (asset: RoomAssetDetail) => {
    const name = asset.products?.product_name ?? "ครุภัณฑ์นี้";
    if (!confirm(`ยืนยันการลบ ${name} ออกจากห้อง?`)) return;
    setBusyAssetId(asset.asset_id);
    const { error: assetErr } = await supabase.from("room_asset").delete().eq("asset_id", asset.asset_id);
    if (assetErr) {
      setBusyAssetId(null);
      return fail(assetErr.message);
    }
    if (asset.product_id) {
      const { error: prodErr } = await supabase.from("products").delete().eq("product_id", asset.product_id);
      if (prodErr) {
        setBusyAssetId(null);
        return fail("ไม่สามารถลบได้ อาจมีประวัติแจ้งซ่อมของครุภัณฑ์นี้อยู่: " + prodErr.message);
      }
    }
    setBusyAssetId(null);
    onChanged();
  };

  const addItems = async (e: React.FormEvent) => {
    e.preventDefault();
    const names = newItem
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (names.length === 0) return;
    setIsAddingItem(true);
    const { added, error } = await addRoomEquipment(room.room_id, names, categories, statuses);
    setIsAddingItem(false);
    if (error) return fail(error);
    ok(`เพิ่มครุภัณฑ์ ${added} รายการแล้ว`);
    setNewItem("");
    onChanged();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end md:items-center justify-center md:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`ห้อง ${room.room_number}`}
        onClick={(e) => e.stopPropagation()}
        className="glass-card w-full md:max-w-2xl max-h-[92dvh] overflow-y-auto rounded-t-3xl md:rounded-3xl shadow-glass-lg"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-br from-brand-500 to-brand-700 text-white px-5 py-4 flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <DoorOpen size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/75">ห้องพัก</p>
            <p className="text-2xl font-bold leading-tight truncate">{room.room_number}</p>
            <p className="text-xs text-white/80">ชั้น {room.floor || "-"}</p>
          </div>
          <button onClick={onClose} aria-label="ปิด" className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 md:p-5 space-y-5">
          {notice && (
            <div
              className={`text-sm rounded-xl px-4 py-2.5 border flex items-start gap-2 ${
                notice.type === "error" ? "bg-red-50/80 border-red-200/60 text-red-600" : "bg-emerald-50/80 border-emerald-200/60 text-emerald-600"
              }`}
            >
              <span className="flex-1">{notice.text}</span>
              <button onClick={() => setNotice(null)} aria-label="ปิดข้อความ" className="opacity-60 hover:opacity-100">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Room info */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-700">ข้อมูลห้อง</h3>
              {!isEditingRoom && (
                <div className="flex gap-2">
                  <button onClick={startRoomEdit} className="btn-ghost px-2.5 py-1 rounded-lg text-xs flex items-center gap-1">
                    <Pencil size={13} /> แก้ไข
                  </button>
                  <button
                    onClick={deleteRoom}
                    disabled={isDeletingRoom}
                    className="px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 bg-red-100/70 text-red-500 hover:bg-red-100 disabled:opacity-50"
                  >
                    {isDeletingRoom ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} ลบห้อง
                  </button>
                </div>
              )}
            </div>

            {isEditingRoom ? (
              <div className="rounded-xl bg-white/60 border border-brand-100/70 p-3 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">เลขห้อง</label>
                    <input
                      value={roomValues.room_number}
                      onChange={(e) => setRoomValues((v) => ({ ...v, room_number: e.target.value }))}
                      className="glass-input px-2.5 py-1.5 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">ชั้น</label>
                    <input
                      value={roomValues.floor}
                      onChange={(e) => setRoomValues((v) => ({ ...v, floor: e.target.value }))}
                      className="glass-input px-2.5 py-1.5 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">ค่าเช่า/เดือน</label>
                    <input
                      type="number"
                      step="0.01"
                      value={roomValues.rent_price}
                      onChange={(e) => setRoomValues((v) => ({ ...v, rent_price: e.target.value }))}
                      className="glass-input px-2.5 py-1.5 rounded-lg text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setIsEditingRoom(false)} className="btn-ghost px-3 py-1.5 rounded-lg text-xs">
                    ยกเลิก
                  </button>
                  <button
                    onClick={saveRoom}
                    disabled={isSavingRoom}
                    className="btn-primary px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5"
                  >
                    {isSavingRoom ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} บันทึก
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-white/60 border border-brand-100/70 p-3">
                  <p className="text-[11px] text-slate-400">เลขห้อง</p>
                  <p className="text-base font-bold text-slate-800 truncate">{room.room_number}</p>
                </div>
                <div className="rounded-xl bg-white/60 border border-brand-100/70 p-3">
                  <p className="text-[11px] text-slate-400">ชั้น</p>
                  <p className="text-base font-bold text-slate-800 truncate">{room.floor || "-"}</p>
                </div>
                <div className="rounded-xl bg-brand-50/80 border border-brand-100/70 p-3">
                  <p className="text-[11px] text-slate-400">ค่าเช่า/เดือน</p>
                  <p className="text-base font-bold text-brand-700 truncate">{formatCurrency(room.rent_price)}</p>
                </div>
              </div>
            )}
          </section>

          {/* Accounts */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                <Users size={15} className="text-brand-600" /> บัญชีของห้อง
              </h3>
              {!showAddAccount && (
                <button
                  onClick={() => {
                    setShowAddAccount(true);
                    setNewPassword(generatePassword());
                  }}
                  className="btn-ghost px-2.5 py-1 rounded-lg text-xs flex items-center gap-1"
                >
                  <UserPlus size={13} /> เพิ่มบัญชี
                </button>
              )}
            </div>

            {accounts.length === 0 && !showAddAccount && (
              <div className="rounded-xl border border-dashed border-brand-200 p-4 text-center text-sm text-slate-400">
                ห้องนี้ยังไม่มีบัญชีผู้เช่า
              </div>
            )}

            {accounts.map((a) => (
              <TenantAccountRow
                key={a.email}
                account={a}
                isSelf={a.email.toLowerCase() === sessionEmail?.toLowerCase()}
                knownPassword={knownPasswords[a.email.toLowerCase()]}
                onPasswordSet={onPasswordSet}
                onChanged={onChanged}
                onError={fail}
                onSuccess={ok}
              />
            ))}

            {showAddAccount && (
              <form onSubmit={createAccount} className="rounded-xl bg-white/60 border border-brand-100/70 p-3 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">อีเมล</label>
                    <input
                      type="email"
                      required
                      autoFocus
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="glass-input px-2.5 py-1.5 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">รหัสผ่าน</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="glass-input pl-2.5 pr-16 py-1.5 rounded-lg text-sm font-mono"
                      />
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex">
                        <button type="button" onClick={() => setNewPassword(generatePassword())} title="สุ่มรหัสผ่าน" className="p-1.5 rounded-md text-slate-500 hover:bg-brand-50">
                          <Shuffle size={14} />
                        </button>
                        <button type="button" onClick={() => setShowNewPassword((v) => !v)} title={showNewPassword ? "ซ่อน" : "แสดง"} className="p-1.5 rounded-md text-slate-500 hover:bg-brand-50">
                          {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowAddAccount(false)} className="btn-ghost px-3 py-1.5 rounded-lg text-xs">
                    ยกเลิก
                  </button>
                  <button type="submit" disabled={isCreatingAccount} className="btn-primary px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5">
                    {isCreatingAccount ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />} สร้างบัญชี
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* Equipment */}
          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                <Package size={15} className="text-brand-600" /> ครุภัณฑ์ ({assets.length})
              </h3>
              <div className="flex flex-wrap gap-1">
                {statusSummary.map(([name, count]) => (
                  <span key={name} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${assetStatusChipClass(name)}`}>
                    {shortStatus(name)} {count}
                  </span>
                ))}
              </div>
            </div>

            {assets.length === 0 ? (
              <div className="rounded-xl border border-dashed border-brand-200 p-4 text-center text-sm text-slate-400">ยังไม่มีครุภัณฑ์ในห้องนี้</div>
            ) : (
              <ul className="rounded-xl bg-white/60 border border-brand-100/70 divide-y divide-brand-100/70">
                {assets.map((a) => {
                  const name = statusName(a.status_id);
                  return (
                    <li key={a.asset_id} className="flex items-center gap-3 p-2.5">
                      <div className="scale-[0.7] -m-2.5 origin-center">
                        <AssetAvatar imageUrl={a.products?.product_image} name={a.products?.product_name} />
                      </div>
                      <span className="flex-1 min-w-0 text-sm font-medium text-slate-800 truncate">{a.products?.product_name ?? "-"}</span>
                      <select
                        value={a.status_id ?? ""}
                        onChange={(e) => changeAssetStatus(a, Number(e.target.value))}
                        disabled={busyAssetId === a.asset_id}
                        aria-label={`สถานะของ ${a.products?.product_name ?? "ครุภัณฑ์"}`}
                        className={`rounded-full px-2 py-1 text-xs font-semibold border-0 outline-none focus:ring-2 focus:ring-brand-400/40 shrink-0 ${assetStatusChipClass(name)}`}
                      >
                        {a.status_id == null && <option value="">ไม่ระบุ</option>}
                        {statuses.map((s) => (
                          <option key={s.status_id} value={s.status_id}>
                            {shortStatus(s.status_name)}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => deleteAsset(a)}
                        disabled={busyAssetId === a.asset_id}
                        title="ลบออกจากห้อง"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-40 shrink-0"
                      >
                        {busyAssetId === a.asset_id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <form onSubmit={addItems} className="flex gap-2">
              <input
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="เพิ่มครุภัณฑ์ (คั่นหลายรายการด้วย ,)"
                className="glass-input px-3 py-2 rounded-lg text-sm"
              />
              <button
                type="submit"
                disabled={isAddingItem || !newItem.trim()}
                className="btn-primary px-3 py-2 rounded-lg text-sm flex items-center gap-1 shrink-0"
              >
                {isAddingItem ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} เพิ่ม
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
