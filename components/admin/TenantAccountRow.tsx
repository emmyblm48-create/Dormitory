"use client";

import { useState } from "react";
import { Check, Copy, Eye, EyeOff, KeyRound, Loader2, Shuffle, Trash2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { callAdminApi, generatePassword } from "@/lib/tenant-admin";
import type { UserProfile } from "@/lib/types";

interface Props {
  account: UserProfile;
  isSelf: boolean;
  // Password set for this account during the current admin session, if any
  knownPassword?: string;
  onPasswordSet: (email: string, password: string) => void;
  onChanged: () => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

export function TenantAccountRow({ account, isSelf, knownPassword, onPasswordSet, onChanged, onError, onSuccess }: Props) {
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [showKnown, setShowKnown] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");
  const [showNew, setShowNew] = useState(true);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const changeRole = async (role: string) => {
    if (role === account.role) return;
    if (isSelf && role !== "admin" && !confirm("คุณกำลังลดสิทธิ์บัญชีของตัวเอง จะไม่สามารถเข้าหน้าผู้ดูแลได้อีก ยืนยัน?")) return;
    setIsSavingRole(true);
    const { error } = await supabase.from("user_extra").update({ role }).eq("email", account.email);
    setIsSavingRole(false);
    if (error) return onError(error.message);
    onSuccess(`เปลี่ยนบทบาทของ ${account.email} เป็น ${role} แล้ว`);
    onChanged();
  };

  const savePassword = async () => {
    if (passwordValue.length < 6) return onError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
    setIsSavingPassword(true);
    const { ok, error } = await callAdminApi("/api/admin/reset-tenant-password", {
      email: account.email,
      password: passwordValue,
    });
    setIsSavingPassword(false);
    if (!ok) return onError(error || "เปลี่ยนรหัสผ่านไม่สำเร็จ");
    onPasswordSet(account.email, passwordValue);
    onSuccess(`เปลี่ยนรหัสผ่านของ ${account.email} แล้ว`);
    setIsEditingPassword(false);
    setPasswordValue("");
    setShowKnown(true);
  };

  const handleDelete = async () => {
    if (!confirm(`ยืนยันการลบบัญชี ${account.email}?`)) return;
    setIsDeleting(true);
    const { ok, error } = await callAdminApi("/api/admin/delete-tenant", { email: account.email });
    setIsDeleting(false);
    if (!ok) return onError(error || "ลบบัญชีไม่สำเร็จ");
    onSuccess(`ลบบัญชี ${account.email} แล้ว`);
    onChanged();
  };

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text).then(
      () => onSuccess("คัดลอกแล้ว"),
      () => onError("คัดลอกไม่สำเร็จ")
    );
  };

  return (
    <div className="rounded-xl bg-white/60 border border-brand-100/70 p-3 space-y-2.5">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 break-all">{account.email}</p>
          <p className="text-xs text-slate-400">ชื่อผู้ใช้: {account.userName}</p>
        </div>
        <button
          onClick={handleDelete}
          disabled={isDeleting || isSelf}
          title={isSelf ? "ไม่สามารถลบบัญชีของตัวเองได้" : "ลบบัญชี"}
          className="p-2 rounded-lg bg-red-100/70 text-red-500 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-x-3 gap-y-2 items-center text-sm">
        <span className="text-xs font-medium text-slate-500">บทบาท</span>
        <div className="flex items-center gap-2">
          <select
            value={account.role}
            onChange={(e) => changeRole(e.target.value)}
            disabled={isSavingRole}
            className={`glass-input !w-auto px-2.5 py-1 rounded-full text-xs font-semibold ${
              account.role === "admin" ? "!bg-amber-100/80 !text-amber-700" : "!bg-brand-100/80 !text-brand-700"
            }`}
          >
            <option value="user">ผู้เช่า (user)</option>
            <option value="admin">ผู้ดูแลระบบ (admin)</option>
          </select>
          {isSavingRole && <Loader2 size={14} className="animate-spin text-brand-400" />}
        </div>

        <span className="text-xs font-medium text-slate-500">รหัสผ่าน</span>
        <div className="flex items-center gap-1.5 min-w-0">
          {knownPassword ? (
            <>
              <code className="font-mono text-sm text-slate-800 bg-white/80 border border-brand-100 rounded-md px-2 py-0.5 truncate">
                {showKnown ? knownPassword : "••••••••"}
              </code>
              <button
                onClick={() => setShowKnown((v) => !v)}
                title={showKnown ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                className="p-1.5 rounded-md text-slate-500 hover:bg-white"
              >
                {showKnown ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
              <button onClick={() => copy(knownPassword)} title="คัดลอก" className="p-1.5 rounded-md text-slate-500 hover:bg-white">
                <Copy size={15} />
              </button>
            </>
          ) : (
            <span className="text-xs text-slate-400">••••••••</span>
          )}
          {!isEditingPassword && (
            <button
              onClick={() => {
                setIsEditingPassword(true);
                setPasswordValue("");
              }}
              className="ml-auto btn-ghost px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 shrink-0"
            >
              <KeyRound size={13} /> ตั้งรหัสใหม่
            </button>
          )}
        </div>
      </div>

      {isEditingPassword && (
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-brand-100/70">
          <div className="relative flex-1">
            <input
              type={showNew ? "text" : "password"}
              autoFocus
              value={passwordValue}
              onChange={(e) => setPasswordValue(e.target.value)}
              placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
              minLength={6}
              className="glass-input pl-2.5 pr-16 py-1.5 rounded-lg text-sm font-mono"
            />
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex">
              <button
                type="button"
                onClick={() => setPasswordValue(generatePassword())}
                title="สุ่มรหัสผ่าน"
                className="p-1.5 rounded-md text-slate-500 hover:bg-brand-50"
              >
                <Shuffle size={14} />
              </button>
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                title={showNew ? "ซ่อน" : "แสดง"}
                className="p-1.5 rounded-md text-slate-500 hover:bg-brand-50"
              >
                {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={savePassword}
              disabled={isSavingPassword}
              className="btn-primary px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5"
            >
              {isSavingPassword ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} บันทึก
            </button>
            <button onClick={() => setIsEditingPassword(false)} className="p-2 rounded-lg bg-white/60 text-slate-500 hover:bg-white/90">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {!knownPassword && !isEditingPassword && (
        <p className="text-[10px] text-slate-400 leading-snug">
          ระบบเก็บรหัสผ่านแบบเข้ารหัส จึงดูรหัสเดิมไม่ได้ ตั้งรหัสใหม่แล้วจะแสดงรหัสนั้นให้ดูได้
        </p>
      )}
    </div>
  );
}
