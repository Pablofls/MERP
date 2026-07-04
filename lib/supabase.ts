import { createBrowserClient } from "@supabase/ssr";

// createBrowserClient stores the session in cookies (not localStorage),
// enabling Next.js middleware to read and verify auth state server-side.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
