"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useGoogleStatus } from "@/lib/hooks/useGoogleStatus";
import { useUser } from "@/lib/context/AuthContext";

const TABS = [
  { href: "/",        label: "Inicio"   },
  { href: "/escolar", label: "Escolar"  },
  { href: "/personal",label: "Personal" },
  { href: "/habitos", label: "Habitos"  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const user = useUser();
  const { conectado } = useGoogleStatus();

  if (pathname === "/login") return null;

  const inicial = user?.email?.[0]?.toUpperCase() ?? "U";
  const perfilActive = pathname.startsWith("/perfil");

  return (
    <aside className="hidden lg:flex flex-col w-52 min-h-screen bg-gray-50 p-5 fixed top-0 left-0 z-40">
      <div className="mb-10 mt-1">
        <Link href="/" className="text-2xl font-bold tracking-tight text-slate-900 hover:text-slate-700 transition-colors">
          MERP
        </Link>
      </div>

      <nav className="flex flex-col gap-0.5 flex-1">
        {TABS.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "px-3 py-2.5 rounded-lg text-base font-medium transition-colors",
                active
                  ? "text-gray-50 cursor-default"
                  : "text-gray-900 hover:text-gray-500"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {/* Perfil al fondo */}
      <Link
        href="/perfil"
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors mt-4",
          perfilActive ? "text-gray-50 cursor-default" : "hover:bg-gray-100"
        )}
      >
        <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">{inicial}</span>
        </div>
        <div className="min-w-0">
          <p className={cn("text-sm font-medium truncate", perfilActive ? "text-gray-50" : "text-gray-900")}>
            Perfil
          </p>
          {conectado !== null && (
            <p className="text-[10px] text-gray-400 truncate">
              {conectado ? "Google conectado" : "Google no conectado"}
            </p>
          )}
        </div>
      </Link>
    </aside>
  );
}
