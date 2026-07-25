"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { BottomNav } from "@/components/BottomNav";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { session, profile, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!session) {
      router.replace("/");
      return;
    }
    if (profile && profile.role !== "user") {
      router.replace("/admin");
    }
  }, [isLoading, session, profile, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  if (isLoading || !session || !profile || profile.role !== "user") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="w-8 h-8 border-4 border-[#0B3C7B] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-200/80 flex justify-center items-center p-0 md:p-6">
      <div className="w-full max-w-5xl min-h-screen md:min-h-[850px] bg-[#EEF2F6] md:rounded-[28px] shadow-2xl relative flex flex-col overflow-hidden border border-slate-300">
        <header className="bg-[#0B57D0] text-white px-6 py-4 flex justify-between items-center shadow-md sticky top-0 z-20">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Home</h1>
            <p className="text-xs text-white/70">ห้อง {profile.userName}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-white text-sm font-medium transition-colors"
            title="ออกจากระบบ"
          >
            <LogOut size={18} />
            <span className="hidden md:inline">ออกจากระบบ</span>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>

        <BottomNav />
      </div>
    </div>
  );
}
