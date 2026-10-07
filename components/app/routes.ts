import {
  Home,
  Megaphone,
  AlertCircle,
  Bell,
  LayoutDashboard,
  Wrench,
  Users,
  Menu,
  type LucideIcon,
} from "lucide-react";

export interface RouteMeta {
  title: string;
  // Parent page for the top bar's back chevron; omitted on tab root pages
  back?: string;
  // Show the app brand instead of a centered title (home screens)
  brand?: boolean;
}

export interface TabItem {
  href: string;
  label: string;
  icon: LucideIcon | "avatar";
  // Extra paths that should light up this tab
  match?: string[];
  badge?: "notifications";
}

export const USER_TABS: TabItem[] = [
  { href: "/user", label: "หน้าหลัก", icon: Home, match: ["/user/requests", "/user/checklist"] },
  { href: "/user/announcements", label: "ข่าวสาร", icon: Megaphone },
  { href: "/user/report", label: "แจ้งซ่อม", icon: AlertCircle },
  { href: "/user/notifications", label: "แจ้งเตือน", icon: Bell, badge: "notifications" },
  { href: "/user/profile", label: "โปรไฟล์", icon: "avatar" },
];

export const ADMIN_TABS: TabItem[] = [
  { href: "/admin", label: "ภาพรวม", icon: LayoutDashboard, match: ["/admin/dashboard"] },
  { href: "/admin/requests", label: "แจ้งซ่อม", icon: Wrench },
  { href: "/admin/tenants", label: "ผู้เช่า", icon: Users },
  { href: "/admin/announcements", label: "ข่าวสาร", icon: Megaphone },
  { href: "/admin/menu", label: "เมนู", icon: Menu, match: ["/admin/products", "/admin/categories", "/admin/notifications"] },
];

const USER_ROUTES: Record<string, RouteMeta> = {
  "/user": { title: "Dormitory", brand: true },
  "/user/announcements": { title: "ข่าวสาร" },
  "/user/report": { title: "แจ้งซ่อม" },
  "/user/notifications": { title: "การแจ้งเตือน" },
  "/user/profile": { title: "โปรไฟล์" },
  "/user/requests": { title: "ประวัติการแจ้งซ่อม", back: "/user" },
  "/user/requests/history": { title: "ซ่อมเสร็จแล้ว", back: "/user/requests" },
  "/user/checklist": { title: "เช็คอุปกรณ์", back: "/user" },
};

const ADMIN_ROUTES: Record<string, RouteMeta> = {
  "/admin": { title: "Dormitory Admin", brand: true },
  "/admin/requests": { title: "แจ้งซ่อม" },
  "/admin/tenants": { title: "ผู้เช่า/ห้องพัก" },
  "/admin/announcements": { title: "ข่าวสาร" },
  "/admin/menu": { title: "เมนู" },
  "/admin/products": { title: "ครุภัณฑ์", back: "/admin/menu" },
  "/admin/categories": { title: "หมวดหมู่/สถานะ", back: "/admin/menu" },
  "/admin/notifications": { title: "การแจ้งเตือน", back: "/admin/menu" },
  "/admin/dashboard/occupancy": { title: "อัตราการเข้าพัก", back: "/admin" },
  "/admin/dashboard/income": { title: "รายได้และยอดเรียกเก็บ", back: "/admin" },
  "/admin/dashboard/open-repairs": { title: "งานซ่อมที่ยังไม่เสร็จ", back: "/admin" },
  "/admin/dashboard/repair-cost": { title: "ค่าซ่อมรายเดือน", back: "/admin" },
};

export const getRouteMeta = (pathname: string): RouteMeta => {
  const routes = pathname.startsWith("/admin") ? ADMIN_ROUTES : USER_ROUTES;
  return routes[pathname.replace(/\/+$/, "") || "/"] ?? { title: "Dormitory" };
};

export const isTabActive = (tab: TabItem, pathname: string) =>
  pathname === tab.href || (tab.match ?? []).some((p) => pathname === p || pathname.startsWith(`${p}/`));
