import { NextRequest, NextResponse } from "next/server";

const BASIC_AUTH_USER = process.env.BASIC_AUTH_USER;
const BASIC_AUTH_PASSWORD = process.env.BASIC_AUTH_PASSWORD;

export function middleware(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (authorization) {
    const encoded = authorization.split(" ")[1];
    const decoded = atob(encoded);
    const [user, password] = decoded.split(":");

    if (
      user === BASIC_AUTH_USER &&
      password === BASIC_AUTH_PASSWORD
    ) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Secure Area"',
    },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};