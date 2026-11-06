import ModuloGuard from "@/features/modulos/components/ModuloGuard";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ModuloGuard clave="habitos">{children}</ModuloGuard>;
}
