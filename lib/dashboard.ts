"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { sameRoom } from "@/lib/tenant-admin";
import type { Room, Status } from "@/lib/types";

export const STATUS_REPORTED = "สถานะแจ้งซ่อม";
export const STATUS_IN_PROGRESS = "สถานะกำลังดำเนินการ";
export const STATUS_DONE = "สถานะเสร็จสมบรูณ์";

// Open requests older than these many days are flagged on the dashboard
export const AGE_WARN_DAYS = 3;
export const AGE_CRITICAL_DAYS = 7;
// A product repaired this many times is suggested for replacement
export const REPLACE_REPAIR_COUNT = 3;

export const MONTH_LABELS = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

export interface RequestRow {
  maintenance_request_id: number;
  description: string | null;
  status: string | null;
  reported_date: string | null;
  product_id: number | null;
  room_id: number | null;
  repair_cost: number | null;
  products: { product_name: string } | null;
}

export interface TenantRow {
  userName: string;
  email: string;
}

export interface AssetRow {
  room_id: number | null;
  status_id: number | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;
export const daysSince = (dateStr: string | null, now: number) =>
  dateStr ? Math.max(0, Math.floor((now - new Date(dateStr).getTime()) / DAY_MS)) : 0;

// Months counted since year 0, so consecutive months differ by 1 across year boundaries
export const monthKey = (d: Date) => d.getFullYear() * 12 + d.getMonth();
export const monthKeyLabel = (key: number) => `${MONTH_LABELS[key % 12]} ${Math.floor(key / 12) + 543}`;

export const isOpen = (status: string | null) => status !== STATUS_DONE;

export const ageBadgeClass = (days: number) =>
  days >= AGE_CRITICAL_DAYS
    ? "bg-red-100/80 text-red-600"
    : days >= AGE_WARN_DAYS
      ? "bg-amber-100/80 text-amber-700"
      : "bg-slate-100/80 text-slate-500";

export const downloadCsv = (filename: string, rows: (string | number)[][]) => {
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = rows.map((r) => r.map(escape).join(",")).join("\r\n");
  // BOM so Excel opens Thai text as UTF-8
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// Loads everything the dashboard pages compute from, in one round of queries
export const useDashboardData = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    const [roomRes, tenantRes, reqRes, assetRes, statusRes] = await Promise.all([
      supabase.from("rooms").select("*").order("room_number"),
      supabase.from("user_extra").select("userName, email").eq("role", "user"),
      supabase
        .from("maintenance_request")
        .select("maintenance_request_id, description, status, reported_date, product_id, room_id, repair_cost, products(product_name)")
        .order("reported_date", { ascending: true }),
      supabase.from("room_asset").select("room_id, status_id"),
      supabase.from("status").select("*").order("status_id"),
    ]);
    if (roomRes.data) setRooms(roomRes.data as Room[]);
    if (tenantRes.data) setTenants(tenantRes.data as TenantRow[]);
    if (reqRes.data) setRequests(reqRes.data as unknown as RequestRow[]);
    if (assetRes.data) setAssets(assetRes.data as AssetRow[]);
    if (statusRes.data) setStatuses(statusRes.data as Status[]);
    setLoadedAt(new Date());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const now = loadedAt?.getTime() ?? Date.now();
  const roomNumber = useCallback(
    (roomId: number | null) => rooms.find((r) => r.room_id === roomId)?.room_number ?? "-",
    [rooms]
  );

  return { rooms, tenants, requests, assets, statuses, isLoading, loadedAt, load, now, roomNumber };
};

export const computeOccupancy = (rooms: Room[], tenants: TenantRow[]) => {
  // Rooms with no rent (e.g. the office) aren't rentable units
  const rentable = rooms.filter((r) => Number(r.rent_price) > 0);
  const withTenant = rentable.map((room) => ({
    room,
    tenant: tenants.find((t) => sameRoom(t.userName, room.room_number)) ?? null,
  }));
  const occupied = withTenant.filter((r) => r.tenant).map((r) => r.room);
  const vacant = withTenant.filter((r) => !r.tenant).map((r) => r.room);
  const expectedRent = occupied.reduce((s, r) => s + Number(r.rent_price), 0);
  const potentialRent = rentable.reduce((s, r) => s + Number(r.rent_price), 0);
  return {
    rentable,
    withTenant,
    occupied,
    vacant,
    percent: rentable.length ? (occupied.length / rentable.length) * 100 : 0,
    expectedRent,
    potentialRent,
    vacancyLoss: potentialRent - expectedRent,
  };
};

// Count and cost per month for the `months` months ending at the month of `now`
export const computeMonthly = (requests: RequestRow[], now: number, months = 12) => {
  const current = monthKey(new Date(now));
  const buckets = Array.from({ length: months }, (_, i) => {
    const key = current - months + 1 + i;
    return { key, label: MONTH_LABELS[key % 12], year: Math.floor(key / 12), count: 0, cost: 0 };
  });
  for (const r of requests) {
    if (!r.reported_date) continue;
    const b = buckets.find((x) => x.key === monthKey(new Date(r.reported_date!)));
    if (!b) continue;
    b.count += 1;
    b.cost += Number(r.repair_cost ?? 0);
  }
  return buckets;
};
