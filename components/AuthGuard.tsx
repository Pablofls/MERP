"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session && pathname !== "/login") {
        router.replace("/login");
      } else {
        setChecked(true);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && pathname !== "/login") {
        router.replace("/login");
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [pathname, router]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <span className="text-text-muted text-sm">Cargando...</span>
      </div>
    );
  }

  return <>{children}</>;
}
