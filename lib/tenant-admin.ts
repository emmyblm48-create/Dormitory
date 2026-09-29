import { supabase } from "@/lib/supabase";
import type { Status } from "@/lib/types";

// room_asset row joined with its product, as loaded by the tenants page
export interface RoomAssetDetail {
  asset_id: number;
  room_id: number | null;
  product_id: number | null;
  status_id: number | null;
  products: { product_name: string; product_image: string | null } | null;
}

export const sameRoom = (a?: string | null, b?: string | null) =>
  (a ?? "").trim().toLowerCase() === (b ?? "").trim().toLowerCase();

export const generatePassword = (length = 8) => {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
};

export const assetStatusChipClass = (statusName?: string | null) => {
  switch (statusName) {
    case "สถานะปกติ":
      return "bg-emerald-100/80 text-emerald-700";
    case "สถานะกำลังดำเนินการ":
      return "bg-amber-100/80 text-amber-700";
    case "สถานะเสร็จสมบรูณ์":
      return "bg-sky-100/80 text-sky-700";
    case "สถานะแจ้งซ่อม":
      return "bg-red-100/80 text-red-600";
    default:
      return "bg-slate-100/80 text-slate-600";
  }
};

export const assetStatusDotClass = (statusName?: string | null) => {
  switch (statusName) {
    case "สถานะปกติ":
      return "bg-emerald-500";
    case "สถานะกำลังดำเนินการ":
      return "bg-amber-400";
    case "สถานะเสร็จสมบรูณ์":
      return "bg-sky-500";
    case "สถานะแจ้งซ่อม":
      return "bg-red-500";
    default:
      return "bg-slate-300";
  }
};

export const shortStatus = (statusName?: string | null) => (statusName ?? "-").replace(/^สถานะ/, "");

// Calls one of the /api/admin/* routes with the current admin's access token
export const callAdminApi = async (path: string, body: Record<string, unknown>) => {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) return { ok: false, error: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่" };

  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: (json.error as string) || "ดำเนินการไม่สำเร็จ" };
  return { ok: true, error: null };
};

// Links catalog products to a room (one room_asset row each), all with the "normal" status
export const assignProductsToRoom = async (
  roomId: number,
  productIds: number[],
  statuses: Status[]
): Promise<{ added: number; error: string | null }> => {
  if (productIds.length === 0) return { added: 0, error: null };

  const defaultStatusId = statuses.find((s) => s.status_name === "สถานะปกติ")?.status_id ?? statuses[0]?.status_id ?? null;
  const today = new Date().toISOString().slice(0, 10);

  const rows = productIds.map((productId) => ({
    product_id: productId,
    room_id: roomId,
    status_id: defaultStatusId,
    date_add: today,
  }));
  const { error } = await supabase.from("room_asset").insert(rows);
  if (error) return { added: 0, error: error.message };
  return { added: rows.length, error: null };
};
