import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const APP_ROUTES = ["/chat", "/explore", "/gpt", "/settings", "/admin"];
const AUTH_ROUTES = ["/sign-in", "/sign-up"];

function isAppPath(pathname: string) {
  return APP_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function isProtectedApi(pathname: string) {
  return (
    pathname.startsWith("/api/chat") ||
    pathname.startsWith("/api/conversations") ||
    pathname.startsWith("/api/gpts") ||
    pathname.startsWith("/api/admin")
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  const isAuthPage = AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const isProtectedPage = isAppPath(pathname);
  const isApiRoute = pathname.startsWith("/api");

  if (!token && (isProtectedPage || isProtectedApi(pathname))) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/chat", request.url));
  }

  if (token && (pathname.startsWith("/admin") || pathname.startsWith("/api/admin"))) {
    if ((token.role as string | undefined) !== "ADMIN") {
      if (pathname.startsWith("/api")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/chat", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/chat/:path*",
    "/explore/:path*",
    "/gpt/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/sign-in",
    "/sign-up",
    "/api/chat",
    "/api/conversations/:path*",
    "/api/gpts/:path*",
    "/api/admin/:path*",
  ],
};
