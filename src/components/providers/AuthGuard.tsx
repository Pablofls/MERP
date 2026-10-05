"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser, useAuthLoading } from "@/lib/context/AuthContext";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useUser();
  const loading = useAuthLoading();

  const isPublic = pathname === "/login" || pathname.startsWith("/auth/");

  useEffect(() => {
    if (!loading && user === null && !isPublic) {
      router.replace("/login");
    }
  }, [loading, user, isPublic, router]);

  if (!isPublic && (loading || user === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <span className="text-text-muted text-sm">Cargando...</span>
      </div>
    );
  }

  return <>{children}</>;
}
