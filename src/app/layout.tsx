import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/nav/BottomNav";
import Sidebar from "@/components/nav/Sidebar";
import ServiceWorkerRegister from "@/components/providers/ServiceWorkerRegister";
import AuthGuard from "@/components/providers/AuthGuard";
import QueryProvider from "@/components/providers/QueryProvider";
import { AuthProvider } from "@/lib/context/AuthContext";
import { TutorialProvider } from "@/features/tutorial/context/TutorialContext";
import { KeyboardNavProvider } from "@/lib/context/KeyboardNavContext";
import Tutorial from "@/features/tutorial/components/TutorialLazy";

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
  themeColor: "#f9fafb",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/** Imágenes de arranque de iOS (PWA): [ancho CSS, alto CSS, dpr]. Generadas en public/splash. */
const SPLASH_IOS: [number, number, number][] = [
  [440, 956, 3], [402, 874, 3], [430, 932, 3], [393, 852, 3], [420, 912, 3],
  [428, 926, 3], [390, 844, 3], [375, 812, 3], [360, 780, 3], [414, 896, 3],
  [414, 896, 2], [375, 667, 2],
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" style={{ backgroundColor: "#f9fafb" }}>
      <head>
        {SPLASH_IOS.map(([w, h, dpr]) => (
          <link
            key={`${w}x${h}@${dpr}`}
            rel="apple-touch-startup-image"
            media={`(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: portrait)`}
            href={`/splash/splash-${w * dpr}x${h * dpr}.png`}
          />
        ))}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MERP" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body>
        <AuthProvider>
          <QueryProvider>
          <TutorialProvider>
            <KeyboardNavProvider>
              <AuthGuard>
                <div className="flex min-h-screen">
                  <Sidebar />
                  <main className="flex-1 lg:ml-56 pb-safe min-w-0">
                    {children}
                  </main>
                </div>
                <BottomNav />
                <Tutorial />
              </AuthGuard>
            </KeyboardNavProvider>
          </TutorialProvider>
          </QueryProvider>
        </AuthProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
