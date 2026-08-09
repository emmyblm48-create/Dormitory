"use client";

import { useEffect, useState } from "react";
import { Pencil, Check, X, Loader2, UserPlus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Room, UserProfile } from "@/lib/types";

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<UserProfile[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ userName: string; role: string }>({ userName: "", role: "user" });

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [isCreating, setIsCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    const [t, r] = await Promise.all([
      supabase.from("user_extra").select("*").order("role"),
      supabase.from("rooms").select("*").order("room_number"),
    ]);
    if (t.data) setTenants(t.data as UserProfile[]);
    if (r.data) setRooms(r.data as Room[]);
    setIsLoading(false);
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

    setCreateSuccess(`สร้างบัญชีสำหรับ ${newEmail} สำเร็จ`);
    setNewEmail("");
    setNewPassword("");
    setNewUserName("");
    setNewRole("user");
    load();
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto w-full">
      <h2 className="text-lg md:text-xl font-bold text-slate-900">จัดการบัญชีผู้เช่า</h2>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-2.5">{error}</div>}
      {createSuccess && <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm rounded-xl px-4 py-2.5">{createSuccess}</div>}

      <form onSubmit={handleCreate} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
        <p className="text-sm font-bold text-slate-700">สร้างบัญชีผู้เช่าใหม่</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">อีเมล</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">เลขห้อง (userName)</label>
            <input
              list="room-list"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              required
              placeholder="เช่น a101"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <datalist id="room-list">
              {rooms.map((r) => (
                <option key={r.room_id} value={r.room_number} />
              ))}
            </datalist>
            <p className="text-[10px] text-slate-400 mt-1">ต้องตรงกับเลขห้อง (room_number) เพื่อให้ระบบจับคู่ห้องอัตโนมัติ</p>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">บทบาท</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="user">ผู้เช่า (user)</option>
              <option value="admin">ผู้ดูแลระบบ (admin)</option>
            </select>
          </div>
        </div>
        <button
          type="submit"
          disabled={isCreating}
          className="bg-[#3182F6] hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-sm flex items-center gap-1.5"
        >
          <UserPlus size={16} /> {isCreating ? "กำลังสร้าง..." : "สร้างบัญชี"}
        </button>
      </form>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-slate-400" size={24} />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100">
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
                      className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <span className="text-sm font-medium text-slate-800">{t.userName}</span>
                  )}
                  {isEditing ? (
                    <select
                      value={editValues.role}
                      onChange={(e) => setEditValues((v) => ({ ...v, role: e.target.value }))}
                      className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  ) : (
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full w-fit ${t.role === "admin" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-[#3182F6]"}`}>
                      {t.role}
                    </span>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  {isEditing ? (
                    <>
                      <button onClick={saveEdit} className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100">
                        <Check size={16} />
                      </button>
                      <button onClick={() => setEditingEmail(null)} className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200">
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <button onClick={() => startEdit(t)} className="p-2 rounded-lg bg-blue-50 text-[#3182F6] hover:bg-blue-100">
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
