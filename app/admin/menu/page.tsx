"use client";

import { useEffect, useState } from "react";
import { Bell, Package, Tags, Users, DoorOpen, Banknote, Wrench, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/components/NotificationCenter";
import { InstallMenuItem, LogoutMenuItem, MenuItem, MenuSection, ProfileHero, PushMenuItem, StatsStrip } from "@/components/app/ProfileParts";

export default function AdminMenuPage() {
  const { profile } = useAuth();
  const { unreadCount } = useNotifications();
  const [stats, setStats] = useState<{ rooms: number; tenants: number; pending: number } | null>(null);

  useEffect(() => {
    (async () => {
      const [rooms, tenants, pending] = await Promise.all([
        supabase.from("rooms").select("*", { count: "exact", head: true }),
        supabase.from("user_extra").select("*", { count: "exact", head: true }).eq("role", "user"),
        supabase.from("maintenance_request").select("*", { count: "exact", head: true }).neq("status", "สถานะเสร็จสมบรูณ์"),
      ]);
      setStats({ rooms: rooms.count ?? 0, tenants: tenants.count ?? 0, pending: pending.count ?? 0 });
    })();
  }, []);

  const name = profile?.userName ?? "Admin";
  const dash = (v?: number) => (stats ? v ?? 0 : "-");

  return (
    <div className="max-w-2xl pb-6 -mx-4 -mt-4 md:mx-auto md:mt-0">
      {/* Negative margins let the hero run edge to edge inside the admin page padding on phones */}
      <ProfileHero initials={name.slice(0, 2).toUpperCase()} name={name} subtitle={profile?.email} role="ผู้ดูแลระบบ" />

      <div className="mt-5">
        <StatsStrip
          stats={[
            { label: "ห้องพัก", value: dash(stats?.rooms), href: "/admin/tenants" },
            { label: "ผู้เช่า", value: dash(stats?.tenants), href: "/admin/tenants" },
            { label: "งานซ่อมค้าง", value: dash(stats?.pending), href: "/admin/dashboard/open-repairs" },
          ]}
        />
      </div>

      <MenuSection title="จัดการข้อมูล">
        <MenuItem icon={Users} label="ผู้เช่า/ห้องพัก" href="/admin/tenants" />
        <MenuItem icon={Package} label="ครุภัณฑ์" href="/admin/products" />
        <MenuItem icon={Tags} label="หมวดหมู่/สถานะ" href="/admin/categories" />
      </MenuSection>

      <MenuSection title="รายงาน">
        <MenuItem icon={DoorOpen} label="อัตราการเข้าพัก" href="/admin/dashboard/occupancy" />
        <MenuItem icon={Banknote} label="รายได้และยอดเรียกเก็บ" href="/admin/dashboard/income" />
        <MenuItem icon={Wrench} label="งานซ่อมที่ยังไม่เสร็จ" href="/admin/dashboard/open-repairs" />
        <MenuItem icon={TrendingUp} label="ค่าซ่อมรายเดือน" href="/admin/dashboard/repair-cost" />
      </MenuSection>

      <MenuSection title="การตั้งค่า">
        <MenuItem
          icon={Bell}
          label="การแจ้งเตือน"
          value={unreadCount > 0 ? <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[11px]">{unreadCount}</span> : undefined}
          href="/admin/notifications"
        />
        <PushMenuItem />
        <InstallMenuItem />
      </MenuSection>

      <MenuSection title="บัญชี">
        <LogoutMenuItem />
      </MenuSection>
    </div>
  );
}
