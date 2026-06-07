import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import FormEditarUsuario from "./FormEditarUsuario";

export default async function EditarUsuarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const user = session?.user as any;
  if (!session?.user) redirect("/login");
  if (user?.perfil !== "ADMIN") redirect("/dashboard");

  const escritorioId = user.escritorioId as string;
  const { id } = await params;

  const usuario = await db.usuario.findFirst({
    where: { id, escritorioId },
    select: { id: true, nome: true, email: true, perfil: true, permissoes: true, ativo: true },
  });

  if (!usuario) notFound();

  const perms = Array.isArray(usuario.permissoes) ? (usuario.permissoes as string[]) : [];
  const isSelf = session.user.id === usuario.id;

  return (
    <>
      <Header
        title={usuario.nome}
        subtitle={`${usuario.email} • ${usuario.perfil === "ADMIN" ? "Administrador" : "Usuário"}`}
      />
      <div className="flex-1 p-6">
        <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
          <Link href="/configuracoes/usuarios" className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Usuários
          </Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">{usuario.nome}</span>
          {isSelf && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-1">você</span>}
        </div>

        <FormEditarUsuario
          usuario={{ ...usuario, permissoes: perms }}
          isSelf={isSelf}
        />
      </div>
    </>
  );
}
