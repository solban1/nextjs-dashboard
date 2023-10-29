import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  providers: [],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = Boolean(auth?.user);
      const isOnDashboard = request.nextUrl.pathname.startsWith("/dashboard");
      console.log(isLoggedIn, isOnDashboard);
      if (isOnDashboard) {
        return isLoggedIn;
      } else {
        return isLoggedIn
          ? Response.redirect(new URL("/dashboard", request.nextUrl))
          : true;
      }
    },
  },
};
