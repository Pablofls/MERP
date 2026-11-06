"use client";
import { usePrefetchRutas } from "@/lib/cache/prefetch";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useModulos } from "@/features/modulos/hooks/useModulos";
import { REGISTRO_MODULOS, IconoModulos } from "@/features/modulos/registro";

const ICONO_INICIO = (active: boolean) => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
  </svg>
);

export default function BottomNav() {
  const pathname = usePathname();
  const prefetchRuta = usePrefetchRutas();
  const { catalogo, estaActivo } = useModulos();
  if (pathname === "/login" || pathname === "/reset-password") return null;

  // Inicio + una pestaña por módulo activo (orden del catálogo) + Módulos al final
  const tabs = [
    { href: "/", label: "Inicio", icon: ICONO_INICIO },
    ...catalogo
      .filter((m) => estaActivo(m.clave))
      .map((m) => {
        const ui = REGISTRO_MODULOS[m.clave];
        return { href: ui.ruta, label: ui.etiqueta, icon: ui.icono };
      }),
    { href: "/modulos", label: "Módulos", icon: (active: boolean) => <IconoModulos active={active} /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 lg:hidden safe-area-bottom">
      <div className="flex justify-around items-center h-14 px-2">
        {tabs.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              onTouchStart={() => prefetchRuta(tab.href)}
              onMouseEnter={() => prefetchRuta(tab.href)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                active ? "text-blue-900" : "text-gray-400"
              )}
            >
              {tab.icon(active)}
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
