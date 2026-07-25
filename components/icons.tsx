import { Package } from "lucide-react";

export const CutoutIcon = () => (
  <svg className="w-8 h-8 md:w-10 md:h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="3" width="16" height="13" rx="2" />
    <path d="M8 7h8" />
    <path d="M10 10l2 3l2-3" />
    <path d="M6 16v3a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-3" />
    <path d="M8 21v1" />
    <path d="M16 21v1" />
  </svg>
);

export const WaterHeaterIcon = () => (
  <svg className="w-8 h-8 md:w-10 md:h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="3" width="10" height="15" rx="2" />
    <circle cx="13" cy="7" r="1.5" fill="currentColor" />
    <circle cx="13" cy="12" r="2" />
    <path d="M4 8a2 2 0 0 1 2-2h2" />
    <path d="M4 8v7a3 3 0 0 0 3 3" />
    <circle cx="4" cy="8" r="1" fill="currentColor" />
  </svg>
);

export const SinkIcon = () => (
  <svg className="w-8 h-8 md:w-10 md:h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 9h16v4a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6V9z" />
    <path d="M12 3v6" />
    <path d="M10 3h4" />
    <path d="M12 19v3" />
    <path d="M8 22h8" />
  </svg>
);

export const DefaultItemIcon = () => <Package className="w-8 h-8 md:w-9 md:h-9 text-white" />;

export const getAssetIcon = (name: string = "") => {
  if (name.includes("น้ำอุ่น")) return WaterHeaterIcon;
  if (name.includes("คัดเอาท์") || name.includes("ไฟ")) return CutoutIcon;
  if (name.includes("อ่าง") || name.includes("ซิงค์")) return SinkIcon;
  return DefaultItemIcon;
};
