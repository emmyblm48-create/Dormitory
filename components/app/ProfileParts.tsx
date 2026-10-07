"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BellRing, ChevronRight, Loader2, LogOut, Smartphone, type LucideIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { detachPushFromAccount, getPushStatus, subscribeToPush, unsubscribeFromPush, type PushStatus } from "@/lib/push";

export function ProfileHero({ initials, name, subtitle, role }: { initials: string; name: string; subtitle?: string; role: string }) {
  return (
    <div className="relative">
      <div className="h-28 md:h-36 rounded-b-[32px] md:rounded-[28px] bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800" />
      <div className="-mt-12 flex flex-col items-center text-center px-4">
        <div className="w-24 h-24 rounded-full bg-white p-1 shadow-glass">
          <div className="w-full h-full rounded-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-2xl font-bold text-brand-700">
            {initials}
          </div>
        </div>
        <h2 className="mt-3 text-2xl font-bold text-slate-900">{name}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        <span className="mt-2 px-3 py-0.5 rounded-full bg-brand-50 text-brand-600 text-[11px] font-semibold tracking-wide">{role}</span>
      </div>
    </div>
  );
}

export function StatsStrip({ stats }: { stats: { label: string; value: string | number; href?: string }[] }) {
  return (
    <div className="mx-5 grid border-y border-slate-200/80" style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}>
      {stats.map((s) => {
        const body = (
          <>
            <p className="text-lg font-bold text-slate-900 tabular-nums">{s.value}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{s.label}</p>
          </>
        );
        return s.href ? (
          <Link key={s.label} href={s.href} className="tap py-3.5 text-center">
            {body}
          </Link>
        ) : (
          <div key={s.label} className="py-3.5 text-center">
            {body}
          </div>
        );
      })}
    </div>
  );
}

export function MenuSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mx-5 pt-5 pb-2 border-b border-slate-200/80 last:border-b-0">
      <h3 className="text-[15px] font-semibold text-slate-900 mb-1">{title}</h3>
      <div>{children}</div>
    </section>
  );
}

interface MenuItemProps {
  icon: LucideIcon;
  label: string;
  value?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
}

export function MenuItem({ icon: Icon, label, value, href, onClick, danger, disabled }: MenuItemProps) {
  const content = (
    <>
      <Icon size={22} className={`shrink-0 mr-4 ${danger ? "text-red-500" : "text-slate-800"}`} />
      <span className={`flex-1 text-[15px] font-medium text-left ${danger ? "text-red-500" : "text-slate-600"}`}>{label}</span>
      {value != null && <span className="text-sm font-semibold text-slate-900 mr-2">{value}</span>}
      {!danger && <ChevronRight size={16} className="text-slate-300 shrink-0" />}
    </>
  );
  const className = "tap w-full flex items-center py-3.5 disabled:opacity-50";
  return href ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      {content}
    </button>
  );
}

// iOS-style action sheet sliding up from the bottom
export function ConfirmSheet({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
  busy,
}: {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  busy?: boolean;
}) {
  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-slate-900/40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
      />
      <div
        className={`absolute inset-x-0 bottom-0 p-3 transition-transform duration-300 ease-out ${open ? "translate-y-0" : "translate-y-full"}`}
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
      >
        <div className="max-w-md mx-auto space-y-2">
          <div className="bg-white rounded-2xl overflow-hidden text-center">
            <div className="px-4 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-900">{title}</p>
              {message && <p className="text-xs text-slate-500 mt-1">{message}</p>}
            </div>
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className="tap w-full py-3.5 text-[17px] font-semibold text-red-500 flex items-center justify-center gap-2"
            >
              {busy && <Loader2 size={18} className="animate-spin" />}
              {confirmLabel}
            </button>
          </div>
          <button type="button" onClick={onClose} className="tap w-full py-3.5 bg-white rounded-2xl text-[17px] font-semibold text-brand-600">
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}

// Device push on/off as a menu row, with the reason when it can't be turned on
export function PushMenuItem() {
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPushStatus().then(setStatus);
  }, []);

  const toggle = async () => {
    if (status !== "on" && status !== "off") return;
    setBusy(true);
    setError(null);
    const res = status === "on" ? await unsubscribeFromPush() : await subscribeToPush();
    if (!res.ok) setError(res.error ?? "ทำรายการไม่สำเร็จ");
    setStatus(await getPushStatus());
    setBusy(false);
  };

  const value =
    busy || status === null ? (
      <Loader2 size={16} className="animate-spin text-slate-400" />
    ) : status === "on" ? (
      <span className="text-emerald-600">เปิดอยู่</span>
    ) : status === "off" ? (
      <span className="text-slate-400 font-medium">ปิดอยู่</span>
    ) : (
      <span className="text-slate-400 font-medium">ใช้ไม่ได้</span>
    );

  const hint =
    status === "needs-install"
      ? "บน iPhone/iPad ต้องเพิ่มแอปไปยังหน้าจอโฮมก่อน"
      : status === "denied"
        ? "ถูกปิดกั้นในตั้งค่าเบราว์เซอร์"
        : status === "unsupported"
          ? "เบราว์เซอร์นี้ไม่รองรับ"
          : null;

  return (
    <>
      <MenuItem icon={BellRing} label="แจ้งเตือนบนอุปกรณ์นี้" value={value} onClick={toggle} disabled={busy} />
      {(error || hint) && <p className={`-mt-2 mb-2 pl-[38px] text-[11px] ${error ? "text-red-500" : "text-slate-400"}`}>{error ?? hint}</p>}
    </>
  );
}

// Explains how to add the web app to the home screen, unless it's already running installed
export function InstallMenuItem() {
  const [standalone, setStandalone] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setStandalone(
      window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true
    );
  }, []);

  if (standalone) return null;
  return (
    <>
      <MenuItem icon={Smartphone} label="ติดตั้งแอปบนหน้าจอโฮม" onClick={() => setOpen((v) => !v)} />
      {open && (
        <div className="-mt-1 mb-3 ml-[38px] rounded-xl bg-brand-50/80 border border-brand-100 p-3 text-xs text-slate-600 space-y-1">
          <p>
            <b>iPhone/iPad (Safari):</b> กดปุ่มแชร์ → &quot;เพิ่มไปยังหน้าจอโฮม&quot;
          </p>
          <p>
            <b>Android (Chrome):</b> กดเมนู ⋮ → &quot;ติดตั้งแอป&quot; หรือ &quot;เพิ่มลงในหน้าจอหลัก&quot;
          </p>
        </div>
      )}
    </>
  );
}

export function LogoutMenuItem() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const logout = async () => {
    setBusy(true);
    await detachPushFromAccount();
    await supabase.auth.signOut();
    router.replace("/");
  };

  return (
    <>
      <MenuItem icon={LogOut} label="ออกจากระบบ" danger onClick={() => setOpen(true)} />
      <ConfirmSheet
        open={open}
        title="ออกจากระบบ?"
        message="อุปกรณ์นี้จะหยุดรับการแจ้งเตือนของบัญชีนี้จนกว่าจะเข้าสู่ระบบอีกครั้ง"
        confirmLabel="ออกจากระบบ"
        onConfirm={logout}
        onClose={() => setOpen(false)}
        busy={busy}
      />
    </>
  );
}
