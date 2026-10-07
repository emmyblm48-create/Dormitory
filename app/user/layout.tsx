"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { BottomNav } from "@/components/BottomNav";
import { PullToRefresh } from "@/components/PullToRefresh";
import { NotificationProvider } from "@/components/NotificationCenter";
import { AppTopBar } from "@/components/app/AppTopBar";
import { TabBar } from "@/components/app/TabBar";
import { USER_TABS } from "@/components/app/routes";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, profile, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!session || !profile) {
      router.replace("/");
      return;
    }
    if (profile.role !== "user") {
      router.replace("/admin");
    }
  }, [isLoading, session, profile, router]);

  if (isLoading || !session || !profile || profile.role !== "user") {
    return (
      <div className="h-dvh flex items-center justify-center">
        <div className="w-9 h-9 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <NotificationProvider email={session.user.email ?? profile.email}>
      <div className="min-h-dvh flex flex-col md:flex-row">
        <BottomNav />

        <div className="flex-1 flex flex-col min-h-dvh min-w-0">
          <AppTopBar />

          <main className="flex-1 overflow-y-auto pb-[calc(96px+env(safe-area-inset-bottom,0px))] md:pb-0">
            <PullToRefresh>
              <div key={pathname} className="page-enter">
                {children}
              </div>
            </PullToRefresh>
          </main>
        </div>
      </div>
      <TabBar tabs={USER_TABS} avatarText={profile.userName.slice(0, 4)} />
    </NotificationProvider>
  );
}
