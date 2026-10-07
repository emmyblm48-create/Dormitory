"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

// Pull distance (px, after resistance) needed to trigger a refresh, and the most it can stretch
const THRESHOLD = 70;
const MAX_PULL = 110;
const RESISTANCE = 0.5;
// Keep the spinner visible at least this long so the refresh registers visually
const MIN_SPIN_MS = 700;

// A touch shouldn't start a pull from inside an overlay (modals, nav dock) or from a
// nested scroll area that isn't at its top, since the user is scrolling that instead.
const isBlocked = (target: EventTarget | null) => {
  let el = target instanceof HTMLElement ? target : null;
  while (el && el !== document.body) {
    const style = getComputedStyle(el);
    if (style.position === "fixed") return true;
    if ((style.overflowY === "auto" || style.overflowY === "scroll") && el.scrollTop > 0) return true;
    el = el.parentElement;
  }
  return false;
};

// Wraps page content; pulling down at the top of the page remounts the children,
// which re-runs each page's data-loading effects without a full browser reload.
export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const [pull, setPull] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [contentKey, setContentKey] = useState(0);
  const startY = useRef<number | null>(null);
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);

  const setPullDistance = (value: number) => {
    pullRef.current = value;
    setPull(value);
  };

  const refresh = useCallback(() => {
    refreshingRef.current = true;
    setIsRefreshing(true);
    setPullDistance(THRESHOLD);
    setContentKey((k) => k + 1);
    setTimeout(() => {
      refreshingRef.current = false;
      setIsRefreshing(false);
      setPullDistance(0);
    }, MIN_SPIN_MS);
  }, []);

  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      startY.current =
        !refreshingRef.current && e.touches.length === 1 && window.scrollY <= 0 && !isBlocked(e.target)
          ? e.touches[0].clientY
          : null;
    };

    const onMove = (e: TouchEvent) => {
      if (startY.current == null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) {
        if (pullRef.current !== 0) setPullDistance(0);
        return;
      }
      // We're handling this gesture, so stop the page from scrolling/bouncing underneath
      if (e.cancelable) e.preventDefault();
      setPullDistance(Math.min(MAX_PULL, dy * RESISTANCE));
    };

    const onEnd = () => {
      if (startY.current == null) return;
      startY.current = null;
      if (pullRef.current >= THRESHOLD) refresh();
      else setPullDistance(0);
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, [refresh]);

  const isDragging = startY.current != null && !isRefreshing;
  const progress = Math.min(1, pull / THRESHOLD);

  return (
    <>
      <div
        className="fixed left-1/2 top-[calc(env(safe-area-inset-top,0px)+60px)] z-30 pointer-events-none"
        style={{
          transform: `translate(-50%, ${pull - 48}px)`,
          opacity: pull > 0 ? 1 : 0,
          transition: isDragging ? "none" : "transform 0.25s ease, opacity 0.25s ease",
        }}
      >
        <div className="w-10 h-10 rounded-full bg-white shadow-glass border border-brand-100 flex items-center justify-center text-brand-600">
          <RefreshCw
            size={18}
            className={isRefreshing ? "animate-spin" : ""}
            style={isRefreshing ? undefined : { transform: `rotate(${progress * 270}deg)`, opacity: 0.4 + progress * 0.6 }}
          />
        </div>
      </div>
      <div
        key={contentKey}
        style={{
          // Only transform while pulling: a transform would otherwise break fixed-position modals inside
          transform: pull > 0 ? `translateY(${pull * 0.6}px)` : "none",
          transition: isDragging ? "none" : "transform 0.25s ease",
        }}
      >
        {children}
      </div>
    </>
  );
}
