"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/",        label: "Inicio",   emoji: "🏠" },
  { href: "/escolar", label: "Escolar",  emoji: "📚" },
  { href: "/personal",label: "Personal", emoji: "👤" },
  { href: "/habitos", label: "Hábitos",  emoji: "📊" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-56 min-h-screen bg-gray-50 border-r border-gray-200 p-4 fixed top-0 left-0 z-40">
      <div className="mb-8 mt-2">
        <span className="text-2xl font-bold text-indigo-600">MERP</span>
        <p className="text-xs text-gray-400 mt-0.5">Tu ERP personal</p>
      </div>
      <nav className="flex flex-col gap-1">
        {TABS.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <span className="text-base">{tab.emoji}</span>
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
