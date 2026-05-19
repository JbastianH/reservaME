import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  
  // Definir rutas protegidas
  const isAdmin = pathname.startsWith("/admin");
  const isBarbero = pathname.startsWith("/barbero");

  // Si no es ruta protegida, dejar pasar
  if (!isAdmin && !isBarbero) return NextResponse.next();

  // BUSCAR LA BANDERA (NO el token real)
  // Buscamos la cookie que creamos manualmente en el LoginClient
  const authFlag = req.cookies.get("auth_flag")?.value;

  // Si no tiene la bandera, lo mandamos al login
  if (!authFlag) {
    const url = req.nextUrl.clone();
    url.pathname = "/portal-baw";
    url.searchParams.set("redirect", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  // NOTA: Ya no validamos el rol aquí porque el middleware no puede leer el token real.
  // Si un BARBERO intenta entrar a /admin, el middleware lo dejará pasar, 
  // PERO cuando la página cargue y pida datos al Backend, el Backend devolverá 403 Forbidden 
  // y no mostrará nada. La seguridad real sigue intacta.

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/barbero/:path*"],
};