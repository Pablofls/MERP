"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser, useAuthLoading } from "@/lib/context/AuthContext";
import PantallaCarga from "@/components/ui/PantallaCarga";

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
    return <PantallaCarga />;
  }

  return <>{children}</>;
}
