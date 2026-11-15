import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function middleware(request) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(list) {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );
  // getSession membaca token dari cookie (tanpa panggilan jaringan) dan tetap menyegarkan token kedaluwarsa.
  // Keabsahan sesi diperiksa penuh oleh halaman (ambilSesi memakai getUser).
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  const path = request.nextUrl.pathname;
  const butuhLogin = path.startsWith("/dashboard") || path.startsWith("/ganti-password");
  if (butuhLogin && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/masuk";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/ganti-password/:path*"],
};
