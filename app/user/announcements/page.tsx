"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Pin, Megaphone } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Announcement } from "@/lib/types";

export default function UserAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("ทั้งหมด");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });
      if (!error && data) setAnnouncements(data as Announcement[]);
      setIsLoading(false);
    })();
  }, []);

  const categories = useMemo(
    () => ["ทั้งหมด", ...Array.from(new Set(announcements.map((a) => a.category)))],
    [announcements]
  );

  const visible = useMemo(
    () => (activeCategory === "ทั้งหมด" ? announcements : announcements.filter((a) => a.category === activeCategory)),
    [announcements, activeCategory]
  );

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto w-full space-y-4">
      <div>
        <h3 className="text-lg font-bold text-slate-900">ข่าวสารประชาสัมพันธ์</h3>
        <p className="text-sm text-slate-400">ข่าวสารและกฎระเบียบภายในหอพัก</p>
      </div>

      {categories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                activeCategory === c
                  ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow"
                  : "bg-white/60 text-slate-500 hover:bg-white/90"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-brand-400" size={24} />
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm glass-card rounded-2xl flex flex-col items-center gap-2">
          <Megaphone size={28} className="text-slate-300" />
          ยังไม่มีข่าวประชาสัมพันธ์
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((a) => {
            const expanded = expandedId === a.announcement_id;
            return (
              <button
                key={a.announcement_id}
                onClick={() => setExpandedId(expanded ? null : a.announcement_id)}
                className="w-full text-left glass-card rounded-2xl p-4 hover:bg-white/85 transition-colors"
              >
                {a.image_path && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.image_path} alt="" className="w-full max-h-48 rounded-xl object-cover mb-3" />
                )}
                <div className="flex items-start gap-2">
                  {a.is_pinned && <Pin size={15} className="text-amber-500 shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-semibold bg-brand-100/80 text-brand-600 px-2 py-0.5 rounded-full">
                        {a.category}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(a.created_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 mt-1">{a.title}</h4>
                    <p className={`text-sm text-slate-600 mt-1 whitespace-pre-wrap ${expanded ? "" : "line-clamp-2"}`}>
                      {a.content}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
