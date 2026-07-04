"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/lib/context/AuthContext";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useUser();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (user === null && pathname !== "/login") {
      router.replace("/login");
    } else {
      setChecked(true);
    }
  }, [user, pathname, router]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <span className="text-text-muted text-sm">Cargando...</span>
      </div>
    );
  }

  return <>{children}</>;
}
