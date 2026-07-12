import type { NextAuthConfig } from "next-auth";

// Edge-safe config: no providers here (Credentials needs Prisma/bcrypt,
// which don't run in the Edge middleware runtime). This is consumed by
// middleware.ts directly, and spread into the full config in auth.ts.
export const authConfig: NextAuthConfig = {
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = Boolean(auth?.user);
      const isLoginPage = request.nextUrl.pathname === "/login";

      if (isLoggedIn && isLoginPage) {
        return Response.redirect(new URL("/", request.nextUrl));
      }
      if (!isLoggedIn && !isLoginPage) {
        return false; // Auth.js redirects to `pages.signIn` automatically.
      }
      return true;
    },
  },
};
