import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

// Edge-safe config: no Prisma adapter, used by middleware
export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtected =
        nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/onboarding");
      if (isProtected && !isLoggedIn) {
        // Redirect to landing page instead of NextAuth's default /api/auth/signin
        return Response.redirect(new URL("/", nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.onboarded = (user as { onboarded?: boolean }).onboarded ?? false;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.onboarded = (token.onboarded as boolean) ?? false;
      }
      return session;
    },
  },
};
