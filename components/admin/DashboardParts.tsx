"use client";

import { Download, RefreshCw } from "lucide-react";

export function DetailHeader({
  title,
  loadedAt,
  isLoading,
  onRefresh,
  actions,
}: {
  title: string;
  loadedAt: Date | null;
  isLoading: boolean;
  onRefresh: () => void;
  actions?: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="sr-only">{title}</h2>
          <p className="text-[11px] text-slate-400">
            {loadedAt ? `ข้อมูล ณ ${loadedAt.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })} น.` : "กำลังโหลดข้อมูล..."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <button onClick={onRefresh} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg" title="รีเฟรช">
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function StatTile({ label, value, sub, tone = "text-slate-900" }: { label: string; value: string | number; sub?: string; tone?: string }) {
  return (
    <div className="glass-card rounded-2xl p-4">
      <p className="text-xs text-slate-400 font-medium">{label}</p>
      <p className={`text-xl font-bold tabular-nums ${tone}`}>{value}</p>
      {sub && <p className="text-[11px] text-slate-500">{sub}</p>}
    </div>
  );
}

export function Placeholder({ text }: { text: string }) {
  return <div className="text-center py-6 text-slate-400 text-xs">{text}</div>;
}

export function ExportButton({ onClick, disabled, label = "ส่งออก CSV" }: { onClick: () => void; disabled?: boolean; label?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
    >
      <Download size={14} />
      {label}
    </button>
  );
}
