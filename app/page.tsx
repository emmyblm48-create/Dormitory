"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

// Login in the BLM48 Membership style: no card, plain white page, underline inputs with
// labels above, and a dark pill button.
export default function LoginPage() {
  const router = useRouter();
  const { session, profile, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading || !session || !profile) return;
    router.replace(profile.role === "admin" ? "/admin" : "/user");
  }, [isLoading, session, profile, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setLoginError("เข้าสู่ระบบไม่สำเร็จ: " + error.message);
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="h-dvh flex items-center justify-center bg-white">
        <div className="w-9 h-9 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (session && !profile) {
    return (
      <div className="h-dvh flex flex-col items-center justify-center gap-4 px-6 text-center bg-white">
        <p className="text-slate-600 text-sm max-w-xs">ไม่พบข้อมูลผู้ใช้สำหรับบัญชีนี้ กรุณาติดต่อผู้ดูแลระบบ</p>
        <button
          onClick={() => supabase.auth.signOut()}
          className="tap h-12 px-8 rounded-full bg-slate-900 text-white text-sm font-bold"
        >
          ออกจากระบบ
        </button>
      </div>
    );
  }

  const fieldClass =
    "w-full h-[46px] bg-transparent border-0 border-b border-slate-200 rounded-none pr-10 text-base text-slate-700 placeholder:text-slate-300 placeholder:text-sm outline-none transition-colors focus:border-brand-500";
  const labelClass = "block text-sm font-medium text-slate-400 transition-colors group-focus-within:text-brand-600";

  return (
    <div
      className="relative z-10 min-h-dvh flex items-center justify-center bg-white"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="w-full max-w-[360px] px-7 py-10 text-center page-enter">
        <h1 className="text-[30px] font-bold text-slate-700 tracking-tight mb-7">Dormitory Login</h1>

        <form onSubmit={handleLogin} className="text-left">
          <div className="group mb-[18px]">
            <label htmlFor="email" className={labelClass}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="กรอกอีเมลบัญชีห้องพัก"
              required
              autoComplete="username"
              className={fieldClass}
            />
          </div>

          <div className="group mb-[18px]">
            <label htmlFor="password" className={labelClass}>
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="กรอกรหัสผ่าน"
                required
                autoComplete="current-password"
                className={fieldClass}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-slate-700"
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </div>

          {loginError && <p className="text-red-500 text-sm font-medium text-center">{loginError}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-[50px] mt-3.5 rounded-full bg-[#111] text-white text-[17px] font-bold flex items-center justify-center gap-2 transition active:scale-[0.98] active:opacity-90 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" /> กำลังเข้าสู่ระบบ...
              </>
            ) : (
              <>
                Sign In <ArrowRight size={19} strokeWidth={2.5} />
              </>
            )}
          </button>
        </form>

        <div className="flex items-center gap-2.5 mt-[26px] mb-4 text-[13px] text-slate-400 before:flex-1 before:h-px before:bg-slate-200 after:flex-1 after:h-px after:bg-slate-200">
          หรือถ้ายังไม่มีบัญชี
        </div>

        <p className="text-[13px] text-slate-400 leading-relaxed">
          หมายเหตุ : บัญชีผู้เช่าสร้างโดยผู้ดูแลหอพัก
          <br />
          ติดต่อ <b className="text-brand-600 font-bold">สำนักงานหอพัก</b> เพื่อรับอีเมลและรหัสผ่าน
        </p>
      </div>
    </div>
  );
}
