"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { DormitoryLogo } from "@/components/DormitoryLogo";
import { getRouteMeta } from "@/components/app/routes";

// App-style top bar: brand on home screens, centered page title with a back chevron on
// sub-pages. Flat white, gaining a hairline shadow once the page scrolls under it.
export function AppTopBar({ right }: { right?: React.ReactNode }) {
  const pathname = usePathname();
  const meta = getRouteMeta(pathname);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  return (
    <header
      className={`shrink-0 sticky top-0 z-20 bg-white/90 backdrop-blur-xl transition-shadow ${
        scrolled ? "shadow-[0_2px_10px_rgba(4,44,98,0.06)]" : ""
      }`}
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="relative h-14 px-2 md:px-6 flex items-center">
        {meta.brand ? (
          <div className="flex items-center gap-2 pl-2">
            <DormitoryLogo className="w-8 h-8" />
            <span className="text-lg md:text-xl font-bold tracking-wide text-brand-800">{meta.title}</span>
          </div>
        ) : (
          <>
            {meta.back && (
              <Link
                href={meta.back}
                aria-label="ย้อนกลับ"
                className="tap w-10 h-10 flex items-center justify-center rounded-full text-slate-800 hover:bg-slate-100"
              >
                <ChevronLeft size={26} />
              </Link>
            )}
            <h1 className="absolute left-1/2 -translate-x-1/2 max-w-[60%] truncate text-[17px] font-semibold text-slate-900 pointer-events-none">
              {meta.title}
            </h1>
          </>
        )}
        <div className="ml-auto flex items-center gap-1 pr-1">{right}</div>
      </div>
    </header>
  );
}
