import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, readSessionToken } from "@/lib/session";

/**
 * Portero de toda la app: sin cookie de sesión válida, todo redirige a /login.
 * El aislamiento entre usuarios no depende de acá: cada consulta filtra por el
 * user_id de la sesión. Esto solo evita que un anónimo llegue a las pantallas.
 */
export default async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (await readSessionToken(token)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // Todo menos las pantallas públicas, los assets y el manifest.
    "/((?!login|registro|_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|manifest.webmanifest).*)",
  ],
};
