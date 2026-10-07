"use client";

import { useEffect, useState } from "react";
import { ClipboardCheck, ClipboardList, Megaphone } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { readChecked } from "@/lib/checklist";
import { InstallMenuItem, LogoutMenuItem, MenuItem, MenuSection, ProfileHero, PushMenuItem, StatsStrip } from "@/components/app/ProfileParts";

export default function UserProfilePage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<{ total: number; pending: number; assets: number; checked: number } | null>(null);

  useEffect(() => {
    (async () => {
      const [total, pending, { data: roomId }] = await Promise.all([
        supabase.from("maintenance_request").select("*", { count: "exact", head: true }),
        supabase.from("maintenance_request").select("*", { count: "exact", head: true }).neq("status", "สถานะเสร็จสมบรูณ์"),
        supabase.rpc("get_user_room_id"),
      ]);
      let assets = 0;
      let checked = 0;
      if (typeof roomId === "number") {
        const { count } = await supabase.from("room_asset").select("*", { count: "exact", head: true }).eq("room_id", roomId);
        assets = count ?? 0;
        checked = readChecked(roomId).size;
      }
      setStats({ total: total.count ?? 0, pending: pending.count ?? 0, assets, checked });
    })();
  }, []);

  const room = profile?.userName ?? "";
  const dash = (v?: number) => (stats ? v ?? 0 : "-");

  return (
    <div className="max-w-2xl mx-auto w-full pb-6 md:pt-6">
      <ProfileHero initials={room.slice(0, 4)} name={`ห้อง ${room}`} subtitle={profile?.email} role="ผู้เช่า" />

      <div className="mt-5">
        <StatsStrip
          stats={[
            { label: "แจ้งซ่อมทั้งหมด", value: dash(stats?.total), href: "/user/requests" },
            { label: "รอดำเนินการ", value: dash(stats?.pending), href: "/user/requests" },
            { label: "ครุภัณฑ์ในห้อง", value: dash(stats?.assets), href: "/user/checklist" },
          ]}
        />
      </div>

      <MenuSection title="ห้องของฉัน">
        <MenuItem icon={ClipboardList} label="ประวัติการแจ้งซ่อม" href="/user/requests" />
        <MenuItem icon={ClipboardCheck} label="เช็คอุปกรณ์ในห้อง" value={stats ? `${stats.checked}/${stats.assets}` : undefined} href="/user/checklist" />
        <MenuItem icon={Megaphone} label="ข่าวสารหอพัก" href="/user/announcements" />
      </MenuSection>

      <MenuSection title="การตั้งค่า">
        <PushMenuItem />
        <InstallMenuItem />
      </MenuSection>

      <MenuSection title="บัญชี">
        <LogoutMenuItem />
      </MenuSection>
    </div>
  );
}
