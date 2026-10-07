"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AdminNav } from "@/components/AdminNav";
import { PullToRefresh } from "@/components/PullToRefresh";
import { NotificationBell, NotificationProvider } from "@/components/NotificationCenter";
import { AppTopBar } from "@/components/app/AppTopBar";
import { TabBar } from "@/components/app/TabBar";
import { ADMIN_TABS } from "@/components/app/routes";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, profile, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!session || !profile) {
      router.replace("/");
      return;
    }
    if (profile.role !== "admin") {
      router.replace("/user");
    }
  }, [isLoading, session, profile, router]);

  if (isLoading || !session || !profile || profile.role !== "admin") {
    return (
      <div className="h-dvh flex items-center justify-center">
        <div className="w-9 h-9 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <NotificationProvider email={session.user.email ?? profile.email}>
      <div className="min-h-dvh flex flex-col md:flex-row">
        <AdminNav />

        <div className="flex-1 flex flex-col min-h-dvh min-w-0">
          <AppTopBar right={pathname !== "/admin/notifications" && <NotificationBell href="/admin/notifications" />} />

          <main className="flex-1 overflow-y-auto">
            <div className="max-w-6xl mx-auto w-full p-4 pb-[calc(96px+env(safe-area-inset-bottom,0px))] md:p-8 md:pb-8 lg:p-10">
              <PullToRefresh>
                <div key={pathname} className="page-enter">
                  {children}
                </div>
              </PullToRefresh>
            </div>
          </main>
        </div>
      </div>
      <TabBar tabs={ADMIN_TABS} />
    </NotificationProvider>
  );
}
