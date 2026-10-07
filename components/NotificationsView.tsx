"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff, BellRing, CheckCheck, Loader2, Trash2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatFullDate } from "@/lib/format";
import { getPushStatus, subscribeToPush, unsubscribeFromPush, type PushStatus } from "@/lib/push";
import { NOTIFICATION_ICONS, useNotifications, type AppNotification } from "@/components/NotificationCenter";

const timeAgo = (dateStr: string) => {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "เมื่อสักครู่";
  if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ชั่วโมงที่แล้ว`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)} วันที่แล้ว`;
  return formatFullDate(dateStr);
};

const PUSH_STATUS_TEXT: Record<Exclude<PushStatus, "on" | "off">, string> = {
  unsupported: "เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือนบนอุปกรณ์",
  denied: "การแจ้งเตือนถูกปิดกั้นในตั้งค่าเบราว์เซอร์ เปิดอนุญาตก่อนแล้วลองใหม่",
  "needs-install": "บน iPhone/iPad ให้กด แชร์ → เพิ่มไปยังหน้าจอโฮม แล้วเปิดแอปจากหน้าจอโฮมก่อน จึงจะเปิดการแจ้งเตือนได้",
};

export function NotificationsView() {
  const router = useRouter();
  const { refreshUnread } = useNotifications();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pushStatus, setPushStatus] = useState<PushStatus | null>(null);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(100);
    if (data) setItems(data as AppNotification[]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
    getPushStatus().then(setPushStatus);
  }, [load]);

  // New rows arriving while this page is open
  useEffect(() => {
    const channel = supabase
      .channel("notifications-page")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const unread = items.filter((n) => !n.is_read);

  const markAllRead = async () => {
    if (unread.length === 0) return;
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await supabase.from("notifications").update({ is_read: true }).in("id", unread.map((n) => n.id));
    refreshUnread();
  };

  const open = async (n: AppNotification) => {
    if (!n.is_read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
      await supabase.from("notifications").update({ is_read: true }).eq("id", n.id);
      refreshUnread();
    }
    if (n.url) router.push(n.url);
  };

  const remove = async (id: number) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
    await supabase.from("notifications").delete().eq("id", id);
    refreshUnread();
  };

  const clearAll = async () => {
    if (items.length === 0 || !confirm("ลบการแจ้งเตือนทั้งหมด?")) return;
    const ids = items.map((n) => n.id);
    setItems([]);
    await supabase.from("notifications").delete().in("id", ids);
    refreshUnread();
  };

  const togglePush = async () => {
    setPushBusy(true);
    setPushError(null);
    const res = pushStatus === "on" ? await unsubscribeFromPush() : await subscribeToPush();
    if (!res.ok) setPushError(res.error ?? "ทำรายการไม่สำเร็จ");
    setPushStatus(await getPushStatus());
    setPushBusy(false);
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
          การแจ้งเตือน
          {unread.length > 0 && (
            <span className="text-xs bg-red-100/80 text-red-600 px-2.5 py-0.5 rounded-full font-semibold">{unread.length} ใหม่</span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={markAllRead}
            disabled={unread.length === 0}
            className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
          >
            <CheckCheck size={14} /> อ่านทั้งหมด
          </button>
          <button
            onClick={clearAll}
            disabled={items.length === 0}
            className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
          >
            <Trash2 size={14} /> ลบทั้งหมด
          </button>
        </div>
      </div>

      {/* Device push toggle */}
      <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
        <span
          className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-white bg-gradient-to-br ${
            pushStatus === "on" ? "from-emerald-400 to-emerald-600" : "from-slate-300 to-slate-400"
          }`}
        >
          {pushStatus === "on" ? <BellRing size={20} /> : <BellOff size={20} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">แจ้งเตือนบนอุปกรณ์นี้</p>
          <p className="text-[11px] text-slate-500">
            {pushStatus === null
              ? "กำลังตรวจสอบ..."
              : pushStatus === "on"
                ? "เปิดอยู่ จะได้รับแจ้งเตือนแม้ปิดแอปไว้"
                : pushStatus === "off"
                  ? "เปิดเพื่อรับแจ้งเตือนแม้ไม่ได้เปิดแอปอยู่"
                  : PUSH_STATUS_TEXT[pushStatus]}
          </p>
          {pushError && <p className="text-[11px] text-red-500 mt-0.5">{pushError}</p>}
        </div>
        {(pushStatus === "on" || pushStatus === "off") && (
          <button
            onClick={togglePush}
            disabled={pushBusy}
            className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${
              pushStatus === "on" ? "btn-ghost" : "btn-primary"
            }`}
          >
            {pushBusy && <Loader2 size={14} className="animate-spin" />}
            {pushStatus === "on" ? "ปิด" : "เปิดการแจ้งเตือน"}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-brand-400" size={24} />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-10 text-slate-400 text-sm glass-card rounded-2xl flex flex-col items-center gap-2">
          <Bell size={28} className="text-slate-300" />
          ยังไม่มีการแจ้งเตือน
        </div>
      ) : (
        <div className="glass-card rounded-2xl divide-y divide-brand-100 overflow-hidden">
          {items.map((n) => {
            const { icon: Icon, color } = NOTIFICATION_ICONS[n.type] ?? NOTIFICATION_ICONS.status;
            return (
              <div key={n.id} className={`flex items-start gap-3 p-3.5 ${n.is_read ? "" : "bg-brand-50/70"}`}>
                <button onClick={() => open(n)} className="flex items-start gap-3 flex-1 min-w-0 text-left">
                  <span className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-white bg-gradient-to-br ${color}`}>
                    <Icon size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      {!n.is_read && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />}
                      <span className="text-sm font-semibold text-slate-900 truncate">{n.title}</span>
                    </span>
                    <span className="block text-xs text-slate-600">{n.body}</span>
                    <span className="block text-[10px] text-slate-400 mt-0.5" title={formatFullDate(n.created_at)}>
                      {timeAgo(n.created_at)}
                    </span>
                  </span>
                </button>
                <button onClick={() => remove(n.id)} className="p-1 text-slate-300 hover:text-red-500 shrink-0" title="ลบ">
                  <X size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
