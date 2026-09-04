"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { DormitoryLogo } from "@/components/DormitoryLogo";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Sparkle } from "@/components/Sparkle";
import { Paperclip } from "@/components/Paperclip";

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
      <div className="h-dvh flex items-center justify-center">
        <div className="w-9 h-9 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (session && !profile) {
    return (
      <div className="h-dvh flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="glass-card rounded-3xl px-6 py-8 max-w-xs flex flex-col items-center gap-4">
          <p className="text-slate-600 text-sm">
            ไม่พบข้อมูลผู้ใช้สำหรับบัญชีนี้ กรุณาติดต่อผู้ดูแลระบบ
          </p>
          <button
            onClick={() => supabase.auth.signOut()}
            className="btn-primary px-4 py-2 rounded-xl text-sm"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh flex justify-center items-center p-0 md:p-6">
      <ScrollReveal />
      <div className="reveal is-visible w-full max-w-5xl h-dvh md:h-[850px] glass-shell md:rounded-[32px] relative flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 overflow-y-auto">
          <div className="w-full max-w-sm flex flex-col items-center text-center reveal">
            <div className="relative p-4 rounded-3xl bg-cream-50 border border-brand-100 shadow-glass-sm mb-2">
              <Paperclip className="absolute -top-4 -right-3 w-8 h-9 text-brand-400 rotate-12" />
              <Sparkle className="absolute -top-3 -left-4 w-4 h-4 text-mustard-500 animate-sparkle" />
              <Sparkle className="absolute -bottom-2 -right-5 w-3 h-3 text-mint-500 animate-sparkle [animation-delay:1.1s]" />
              <DormitoryLogo className="w-24 h-24 md:w-32 md:h-32" />
            </div>
            <h1
              className="font-display text-4xl text-brand-600 tracking-wide mb-6 mt-2"
              style={{ textShadow: "0 1px 0 #FFFBF3, 0 2px 0 #FADCD5, 0 3px 6px rgba(110,40,25,0.25)" }}
            >
              DORMITORY
            </h1>

            <h2 className="text-2xl font-bold text-slate-900 mb-1">WELCOME</h2>
            <p className="text-slate-500 text-sm mb-6 font-medium">กรุณาเข้าสู่ระบบด้วยบัญชีห้องของท่าน</p>

            <form onSubmit={handleLogin} className="w-full space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="อีเมล"
                  required
                  className="glass-input px-4 py-3.5 rounded-xl shadow-glass-sm text-base md:text-sm"
                />
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="รหัสผ่าน"
                  required
                  className="glass-input px-4 py-3.5 rounded-xl shadow-glass-sm text-base md:text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>

              {loginError && <p className="text-red-500 text-sm font-medium">{loginError}</p>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full py-3.5 rounded-xl text-base mt-2"
              >
                {isSubmitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              </button>
            </form>

            <div className="text-center text-xs text-slate-400 mt-8">
              Dormitory Management System
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
