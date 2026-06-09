import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" as const },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      if (pathname.startsWith("/api/auth")) return true;
      if (pathname === "/login") return true;
      if (pathname === "/" || pathname === "") return true;

      if (!isLoggedIn) return false;
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.escritorioId = (user as any).escritorioId;
        token.perfil = (user as any).perfil;
        token.permissoes = (user as any).permissoes;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        (session.user as any).escritorioId = token.escritorioId;
        (session.user as any).perfil = token.perfil;
        (session.user as any).permissoes = token.permissoes ?? [];
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
