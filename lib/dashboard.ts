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
export const monthKeyStart = (key: number) => new Date(Math.floor(key / 12), key % 12, 1).getTime();
// "YYYY-MM" form used in URLs and file names
export const monthKeyParam = (key: number) => `${Math.floor(key / 12)}-${String((key % 12) + 1).padStart(2, "0")}`;
export const parseMonthParam = (value: string | null) => {
  const m = value?.match(/^(\d{4})-(\d{2})$/);
  if (!m || Number(m[2]) < 1 || Number(m[2]) > 12) return null;
  return Number(m[1]) * 12 + Number(m[2]) - 1;
};

// A run of whole days, months or years picked on the dashboard filter (from..to, both
// inclusive). A single day/month/year is a range whose ends are the same. `end` is exclusive.
export type PeriodKind = "day" | "month" | "year";
export interface Period {
  kind: PeriodKind;
  from: string;
  to: string;
  param: string;
  start: number;
  end: number;
  label: string;
}

export const PERIOD_KINDS: PeriodKind[] = ["day", "month", "year"];

const pad2 = (n: number) => String(n).padStart(2, "0");

// The single day, month or year that contains `d`
const unitOf = (kind: PeriodKind, d: Date) => {
  const y = d.getFullYear();
  const m = d.getMonth();
  const day = d.getDate();
  if (kind === "day") {
    return { param: `${y}-${pad2(m + 1)}-${pad2(day)}`, start: new Date(y, m, day).getTime(), end: new Date(y, m, day + 1).getTime(), y, m, day };
  }
  if (kind === "month") {
    return { param: `${y}-${pad2(m + 1)}`, start: new Date(y, m, 1).getTime(), end: new Date(y, m + 1, 1).getTime(), y, m, day: 1 };
  }
  return { param: String(y), start: new Date(y, 0, 1).getTime(), end: new Date(y + 1, 0, 1).getTime(), y, m: 0, day: 1 };
};

type Unit = ReturnType<typeof unitOf>;

// "23 ต.ค. 2569", "1 – 23 ต.ค. 2569", "25 ธ.ค. 2568 – 5 ม.ค. 2569", "ม.ค. – ก.พ. 2569", "ปี 2568 – 2569"
const rangeLabel = (kind: PeriodKind, a: Unit, b: Unit) => {
  const be = (y: number) => y + 543;
  if (kind === "year") return a.y === b.y ? `ปี ${be(a.y)}` : `ปี ${be(a.y)} – ${be(b.y)}`;
  const part = (u: Unit) => (kind === "day" ? `${u.day} ${MONTH_LABELS[u.m]}` : MONTH_LABELS[u.m]);
  if (a.param === b.param) return `${part(a)} ${be(a.y)}`;
  if (a.y !== b.y) return `${part(a)} ${be(a.y)} – ${part(b)} ${be(b.y)}`;
  if (kind === "day" && a.m === b.m) return `${a.day} – ${b.day} ${MONTH_LABELS[a.m]} ${be(a.y)}`;
  return `${part(a)} – ${part(b)} ${be(a.y)}`;
};

// The range of `kind` units covering `from` through `to`; the ends are swapped if given backwards
export const makePeriod = (kind: PeriodKind, from: Date, to: Date = from): Period => {
  let a = unitOf(kind, from);
  let b = unitOf(kind, to);
  if (b.start < a.start) [a, b] = [b, a];
  return {
    kind,
    from: a.param,
    to: b.param,
    param: a.param === b.param ? a.param : `${a.param}..${b.param}`,
    start: a.start,
    end: b.end,
    label: rangeLabel(kind, a, b),
  };
};

const shiftUnits = (kind: PeriodKind, t: number, n: number) => {
  const d = new Date(t);
  if (kind === "day") return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  if (kind === "month") return new Date(d.getFullYear(), d.getMonth() + n, 1);
  return new Date(d.getFullYear() + n, 0, 1);
};

// Number of days, months or years the range spans
export const periodLength = (p: Period) => {
  const a = new Date(p.start);
  const b = new Date(p.end - 1);
  if (p.kind === "day") return Math.round((p.end - p.start) / DAY_MS);
  if (p.kind === "month") return monthKey(b) - monthKey(a) + 1;
  return b.getFullYear() - a.getFullYear() + 1;
};

// The equally long range just before `p`: yesterday, last month, or e.g. Nov-Dec before Jan-Feb
export const previousPeriod = (p: Period) => {
  const n = periodLength(p);
  return makePeriod(p.kind, shiftUnits(p.kind, p.start, -n), shiftUnits(p.kind, p.end - 1, -n));
};

export const inPeriod = (dateStr: string | null, p: Period) => {
  if (!dateStr) return false;
  const t = new Date(dateStr).getTime();
  return t >= p.start && t < p.end;
};

const parseUnit = (kind: PeriodKind, value: string): Date | null => {
  if (kind === "day") {
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    // Rejects dates that roll over, e.g. 2026-02-30
    return d.getMonth() === Number(m[2]) - 1 && d.getDate() === Number(m[3]) ? d : null;
  }
  if (kind === "month") {
    const key = parseMonthParam(value);
    return key == null ? null : new Date(monthKeyStart(key));
  }
  return /^\d{4}$/.test(value) ? new Date(Number(value), 0, 1) : null;
};

// Reads ?day=, ?month= or ?year= holding one value (2026-10) or a range (2026-01..2026-02);
// anything malformed is ignored
export const parsePeriodParams = (params: URLSearchParams): Period | null => {
  for (const kind of PERIOD_KINDS) {
    const value = params.get(kind);
    if (!value) continue;
    const parts = value.split("..");
    if (parts.length > 2) continue;
    const from = parseUnit(kind, parts[0]);
    const to = parseUnit(kind, parts[1] ?? parts[0]);
    if (from && to) return makePeriod(kind, from, to);
  }
  return null;
};

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
