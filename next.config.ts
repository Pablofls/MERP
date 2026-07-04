import type { NextConfig } from "next";

const CSP = [
  "default-src 'self'",
  // Next.js App Router requires 'unsafe-inline' for inline scripts during hydration
  "script-src 'self' 'unsafe-inline'",
  // Tailwind generates inline styles
  "style-src 'self' 'unsafe-inline'",
  // API calls: own origin, Supabase, Google OAuth + APIs
  [
    "connect-src 'self'",
    "https://*.supabase.co",
    "https://accounts.google.com",
    "https://oauth2.googleapis.com",
    "https://www.googleapis.com",
    "https://tasks.googleapis.com",
  ].join(" "),
  "img-src 'self' data:",
  "font-src 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Service-Worker-Allowed", value: "/" },
          { key: "Cache-Control", value: "no-cache" },
        ],
      },
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
