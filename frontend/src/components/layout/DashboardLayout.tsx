"use client";

import Sidebar from "./Sidebar";
import AuthGuard from "./AuthGuard";
import MobileNav from "./MobileNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 pb-20 lg:p-6 lg:pb-6">
          {children}
        </main>
        <MobileNav />
      </div>
    </AuthGuard>
  );
}
