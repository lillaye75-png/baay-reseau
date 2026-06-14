"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

const publicPaths = ["/login", "/register"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!token && pathname && !publicPaths.includes(pathname)) {
      router.push("/login");
    }
  }, [token, loading, pathname, router]);

  useEffect(() => {
    if (!token) return;
    const handle403 = (e: Event) => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/login?expired=1");
    };
    window.addEventListener("license-expired", handle403);
    return () => window.removeEventListener("license-expired", handle403);
  }, [token, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          <p className="text-sm text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!token && pathname && !publicPaths.includes(pathname)) {
    return null;
  }

  return <>{children}</>;
}
