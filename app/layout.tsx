import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/nav/BottomNav";
import Sidebar from "@/components/nav/Sidebar";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import AuthGuard from "@/components/AuthGuard";

export const metadata: Metadata = {
  title: "MERP",
  description: "Tu ERP personal: escolar, personal y hábitos",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MERP",
  },
  icons: {
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MERP" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body>
        <AuthGuard>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 lg:ml-56 pb-safe min-w-0">
              {children}
            </main>
          </div>
          <BottomNav />
        </AuthGuard>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
