// import NextAuth from "next-auth";
// import { authConfig } from "./auth.config";
// import { auth } from "@/auth";

// TODO: make authentication work
// export default auth;
export default function middleware() {}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
