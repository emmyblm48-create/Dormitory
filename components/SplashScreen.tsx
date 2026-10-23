"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";

const TIPS = ["Preparing your room…", "Checking utility bills…", "Syncing tenant data…"];

// Keeps the splash up at least this long on first open, so it never just flickers.
const MIN_SHOW_MS = 1400;
const FADE_MS = 400;

// Full-screen brand splash: the house mark with its two "room rows" pulsing, the
// wordmark, and an indeterminate progress bar with rotating status lines.
export function SplashScreen({ className = "" }: { className?: string }) {
  const [tip, setTip] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTip((i) => (i + 1) % TIPS.length), 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className={`h-dvh w-full flex flex-col items-center px-8 bg-white ${className}`}
      style={{ paddingBottom: "calc(56px + env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="flex-1 flex flex-col items-center justify-center gap-7">
        <div className="flex flex-col items-center gap-3.5">
          <div className="splash-icon">
            <div className="splash-float">
              <svg width="112" height="112" viewBox="0 0 80 80" fill="none" aria-hidden="true">
                <defs>
                  <linearGradient id="splash-roof" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#3C8CF6" />
                    <stop offset="1" stopColor="#063B82" />
                  </linearGradient>
                </defs>
                <path
                  d="M9 35 L40 11 L71 35 V69 a3 3 0 0 1 -3 3 H12 a3 3 0 0 1 -3 -3 Z"
                  stroke="url(#splash-roof)"
                  strokeWidth="5"
                  strokeLinejoin="round"
                />
                <rect x="22" y="36" width="36" height="31" rx="3" stroke="#0850B0" strokeWidth="3.5" />
                <g className="splash-row">
                  <rect x="27" y="41" width="26" height="9" rx="2" fill="#0850B0" />
                  <circle cx="31.5" cy="45.5" r="1.8" fill="#fff" />
                  <rect x="35" y="44.5" width="14" height="2" rx="1" fill="#fff" />
                </g>
                <g className="splash-row [animation-delay:.35s]">
                  <rect x="27" y="53" width="26" height="9" rx="2" fill="#0850B0" />
                  <circle cx="31.5" cy="57.5" r="1.8" fill="#fff" />
                  <rect x="35" y="56.5" width="14" height="2" rx="1" fill="#fff" />
                </g>
              </svg>
            </div>
          </div>
          <div className="splash-shadow w-[72px] h-2 rounded-[50%] bg-brand-900" />
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <h1 className="splash-up [animation-delay:.35s] m-0 text-[44px] font-bold leading-[1.1] tracking-tight text-brand-900">
            Dormitory
          </h1>
          <p className="splash-up [animation-delay:.5s] m-0 text-base text-slate-500">Dormitory Management System</p>
        </div>
      </div>

      <div className="splash-up [animation-delay:.7s] w-full flex flex-col items-center gap-3.5" role="status" aria-live="polite">
        <div className="w-[180px] h-1.5 rounded-full bg-brand-100 overflow-hidden">
          <div className="splash-bar w-2/5 h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600" />
        </div>
        <p className="m-0 min-h-[22px] text-sm font-medium text-slate-500 text-center">{TIPS[tip]}</p>
      </div>
    </div>
  );
}

// Covers the app on first open until auth has resolved (and at least MIN_SHOW_MS),
// then fades out. Rendered on the server too, so the login page never flashes first.
export function AppSplash() {
  const { isLoading } = useAuth();
  const [minElapsed, setMinElapsed] = useState(false);
  const [phase, setPhase] = useState<"shown" | "leaving" | "gone">("shown");

  useEffect(() => {
    const id = setTimeout(() => setMinElapsed(true), MIN_SHOW_MS);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (phase === "shown" && !isLoading && minElapsed) setPhase("leaving");
  }, [phase, isLoading, minElapsed]);

  useEffect(() => {
    if (phase !== "leaving") return;
    const id = setTimeout(() => setPhase("gone"), FADE_MS);
    return () => clearTimeout(id);
  }, [phase]);

  if (phase === "gone") return null;

  return (
    <div
      className={`fixed inset-0 z-[100] transition-opacity ease-out ${phase === "leaving" ? "pointer-events-none" : ""}`}
      style={{ opacity: phase === "leaving" ? 0 : 1, transitionDuration: `${FADE_MS}ms` }}
      aria-hidden={phase === "leaving"}
    >
      <SplashScreen />
    </div>
  );
}
