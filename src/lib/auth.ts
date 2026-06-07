import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getPermissoes } from "@/lib/permissoes";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.senha) return null;

          const usuario = await db.usuario.findUnique({
            where: { email: credentials.email as string },
          });

          if (!usuario || !usuario.ativo) return null;

          const senhaValida = await bcrypt.compare(
            credentials.senha as string,
            usuario.senha
          );
          if (!senhaValida) return null;

          db.usuario.update({
            where: { id: usuario.id },
            data: { ultimoAcesso: new Date() },
          }).catch(() => {});

          return {
            id: usuario.id,
            email: usuario.email,
            name: usuario.nome,
            escritorioId: usuario.escritorioId,
            perfil: usuario.perfil,
            permissoes: getPermissoes(usuario),
          };
        } catch (err) {
          console.error("[auth] authorize error:", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
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
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
});
