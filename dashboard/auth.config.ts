import type { NextAuthConfig } from "next-auth";

// Edge-safe config: no providers here (Credentials needs Prisma/bcrypt,
// which don't run in the Edge middleware runtime). This is consumed by
// middleware.ts directly, and spread into the full config in auth.ts.
export const authConfig: NextAuthConfig = {
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = Boolean(auth?.user);
      // "/" is the public landing page — always visible, logged in or not.
      const isPublicPage = pathname === "/" || pathname === "/login";

      if (isLoggedIn && pathname === "/login") {
        return Response.redirect(new URL("/dashboard", request.nextUrl));
      }
      if (!isLoggedIn && !isPublicPage) {
        return false; // Auth.js redirects to `pages.signIn` automatically.
      }
      return true;
    },
  },
};
