import ModuloGuard from "@/features/modulos/components/ModuloGuard";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ModuloGuard clave="personal">{children}</ModuloGuard>;
}
