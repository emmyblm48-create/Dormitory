"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardCheck, AlertCircle, ClipboardList, Megaphone, ChevronRight, Pin } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { ScrollReveal } from "@/components/ScrollReveal";
import { ProgressRing } from "@/components/ProgressRing";
import { AssetAvatar } from "@/components/AssetAvatar";
import { readChecked } from "@/lib/checklist";
import type { Announcement, ViewRoomAsset } from "@/lib/types";

export default function UserHomePage() {
  const { profile } = useAuth();
  const [pendingRepairs, setPendingRepairs] = useState(0);
  const [totalRepairs, setTotalRepairs] = useState(0);
  const [assets, setAssets] = useState<ViewRoomAsset[]>([]);
  const [checkedCount, setCheckedCount] = useState(0);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [roomId, setRoomId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const [pending, total, { data: myRoomId }, latestAnnouncement] = await Promise.all([
        supabase
          .from("maintenance_request")
          .select("*", { count: "exact", head: true })
          .neq("status", "สถานะเสร็จสมบรูณ์"),
        supabase.from("maintenance_request").select("*", { count: "exact", head: true }),
        supabase.rpc("get_user_room_id"),
        supabase
          .from("announcements")
          .select("*")
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(1),
      ]);
      setPendingRepairs(pending.count ?? 0);
      setTotalRepairs(total.count ?? 0);
      if (latestAnnouncement.data?.[0]) setAnnouncement(latestAnnouncement.data[0] as Announcement);
      if (typeof myRoomId === "number") {
        setRoomId(myRoomId);
        const { data: roomAssets } = await supabase
          .from("view_room_asset")
          .select("*")
          .eq("room_id", myRoomId)
          .order("product_name");
        if (roomAssets) setAssets(roomAssets as ViewRoomAsset[]);
      }
      setIsLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (roomId == null) return;
    setCheckedCount(readChecked(roomId).size);
  }, [roomId]);

  const checklistPercent = assets.length === 0 ? 0 : Math.round((checkedCount / assets.length) * 100);

  return (
    <div className="space-y-5 md:space-y-6 max-w-6xl mx-auto w-full p-4 md:p-8 lg:p-10">
      <ScrollReveal />

      {/* Hero resident-ID card */}
      <div className="reveal tilt-card relative overflow-hidden rounded-[28px] p-6 md:p-8 bg-gradient-to-br from-brand-600 to-brand-800 text-cream-50 shadow-paper">
        <p className="text-xs uppercase tracking-[0.2em] text-cream-100/70 font-display">Resident</p>
        <h2 className="font-display text-3xl md:text-4xl mt-1 mb-5">ห้อง {profile?.userName}</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/user/checklist"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors rounded-2xl pl-2 pr-4 py-2"
          >
            <ProgressRing
              percent={checklistPercent}
              size={40}
              strokeWidth={4}
              className="text-white"
              trackClassName="text-white/20"
            />
            <span className="text-left">
              <span className="block text-[11px] text-cream-100/70">เช็คอุปกรณ์</span>
              <span className="block text-sm font-bold">
                {checkedCount}/{assets.length} ชิ้น
              </span>
            </span>
          </Link>
          <Link
            href="/user/requests"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors rounded-2xl px-4 py-2"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-white/80 shrink-0" />
            <span className="text-left">
              <span className="block text-[11px] text-cream-100/70">รอดำเนินการ</span>
              <span className="block text-sm font-bold">{isLoading ? "-" : pendingRepairs} รายการ</span>
            </span>
          </Link>
        </div>
      </div>

      {/* Primary CTA */}
      <Link
        href="/user/report"
        style={{ transitionDelay: "60ms" }}
        className="reveal tilt-card btn-primary w-full flex items-center justify-between rounded-2xl px-6 py-5"
      >
        <span className="flex items-center gap-3">
          <AlertCircle size={24} />
          <span className="text-base font-bold">แจ้งซ่อมด่วน</span>
        </span>
        <ChevronRight size={20} />
      </Link>

      {/* Bento grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        <Link
          href="/user/checklist"
          style={{ transitionDelay: "120ms" }}
          className="reveal tilt-card glass-card rounded-3xl p-5 flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br from-brand-500 to-brand-700 shadow-glass-sm">
              <ClipboardCheck size={20} />
            </div>
            <ProgressRing percent={checklistPercent} size={36} strokeWidth={4} />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">เช็คอุปกรณ์</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {assets.length === 0 ? "ยังไม่มีรายการ" : `เช็คแล้ว ${checkedCount} จาก ${assets.length} ชิ้น`}
            </p>
          </div>
        </Link>

        <Link
          href="/user/requests"
          style={{ transitionDelay: "180ms" }}
          className="reveal tilt-card glass-card rounded-3xl p-5 flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-glass-sm">
              <ClipboardList size={20} />
            </div>
            {!!pendingRepairs && <span className="stamp-chip">{pendingRepairs} รอดำเนินการ</span>}
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">ประวัติการแจ้งซ่อม</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {isLoading ? "กำลังโหลด..." : `ทั้งหมด ${totalRepairs} รายการ`}
            </p>
          </div>
        </Link>

        <Link
          href="/user/announcements"
          style={{ transitionDelay: "240ms" }}
          className="reveal tilt-card glass-card rounded-3xl p-5 flex gap-4 items-center md:col-span-2"
        >
          {announcement?.image_path ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={announcement.image_path} alt="" className="w-16 h-16 rounded-2xl object-cover shrink-0" />
          ) : (
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br from-amber-400 to-amber-600 shadow-glass-sm shrink-0">
              <Megaphone size={20} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {announcement?.is_pinned && <Pin size={12} className="text-amber-500 shrink-0" />}
              <p className="font-bold text-slate-900 text-sm truncate">
                {announcement ? announcement.title : "ยังไม่มีข่าวสาร"}
              </p>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
              {announcement ? announcement.content : "ติดตามข่าวสารและกฎระเบียบหอพักได้ที่นี่"}
            </p>
          </div>
          <ChevronRight size={18} className="text-slate-300 shrink-0" />
        </Link>
      </div>

      {/* Room equipment */}
      {assets.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">ครุภัณฑ์ในห้อง</h3>
            <Link href="/user/checklist" className="flex items-center gap-0.5 text-xs font-semibold text-brand-600 hover:text-brand-700">
              ดูทั้งหมด <ChevronRight size={14} />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {assets.map((item) => (
              <Link
                key={item.asset_id}
                href="/user/checklist"
                className="tilt-card shrink-0 w-24 glass-card rounded-2xl p-3 flex flex-col items-center text-center gap-2"
              >
                <AssetAvatar imageUrl={item.product_image} name={item.product_name} />
                <span className="text-[11px] font-semibold text-slate-800 leading-tight line-clamp-2">
                  {item.product_name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
