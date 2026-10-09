import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const TOKEN_COOKIE = "motocare_token";
const AUTH_PAGES = ["/login", "/signup", "/forgot-password", "/reset-password"];

/** Staff/admin-only areas (backend enforces; this is an optimistic redirect). */
const STAFF_ROUTES = ["/customers", "/services", "/overdue-services"];
const ADMIN_ROUTES = ["/admin"];

function isAuthPage(pathname: string) {
  return AUTH_PAGES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

function startsWithAny(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

function isProtected(pathname: string) {
  if (isAuthPage(pathname)) return false;
  return (
    pathname === "/" ||
    startsWithAny(pathname, [...STAFF_ROUTES, ...ADMIN_ROUTES, "/bikes", "/profile"])
  );
}

/** Best-effort role read from the JWT payload (no verification — API enforces). */
function tokenRole(token: string): string | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = JSON.parse(
      Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")
    ) as { role?: unknown };
    return typeof json.role === "string" ? json.role : null;
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TOKEN_COOKIE)?.value;

  if (isProtected(pathname) && !token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (token && isAuthPage(pathname)) {
    const next = request.nextUrl.searchParams.get("next");
    const url = request.nextUrl.clone();
    url.pathname = next && next.startsWith("/") ? next : "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (token) {
    const role = tokenRole(token);
    if (role === "customer" && startsWithAny(pathname, [...STAFF_ROUTES, ...ADMIN_ROUTES])) {
      const url = request.nextUrl.clone();
      url.pathname = "/bikes";
      url.search = "";
      return NextResponse.redirect(url);
    }
    if (role && role !== "admin" && startsWithAny(pathname, ADMIN_ROUTES)) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
