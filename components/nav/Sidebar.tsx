"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/",        label: "Inicio"   },
  { href: "/escolar", label: "Escolar"  },
  { href: "/personal",label: "Personal" },
  { href: "/habitos", label: "Habitos"  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-52 min-h-screen bg-gray-50 p-5 fixed top-0 left-0 z-40">
      <div className="mb-10 mt-1">
        <span className="text-xl font-bold tracking-tight text-slate-900">MERP</span>
      </div>
      <nav className="flex flex-col gap-0.5">
        {TABS.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-blue-900 text-white"
                  : "text-slate-600 hover:bg-gray-100 hover:text-slate-900"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
