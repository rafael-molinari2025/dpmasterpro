import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.senha) return null;

        const usuario = await db.usuario.findUnique({
          where: { email: credentials.email as string },
          include: { escritorio: true },
        });

        if (!usuario || !usuario.ativo) return null;

        const senhaValida = await bcrypt.compare(
          credentials.senha as string,
          usuario.senha
        );
        if (!senhaValida) return null;

        await db.usuario.update({
          where: { id: usuario.id },
          data: { ultimoAcesso: new Date() },
        });

        return {
          id: usuario.id,
          email: usuario.email,
          name: usuario.nome,
          escritorioId: usuario.escritorioId,
          perfil: usuario.perfil,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.escritorioId = (user as any).escritorioId;
        token.perfil = (user as any).perfil;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        (session.user as any).escritorioId = token.escritorioId;
        (session.user as any).perfil = token.perfil;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
});
