import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import Link from "next/link";
import { Plus, Shield, User, CheckCircle, XCircle, Clock } from "lucide-react";

const PERFIL_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  ADMIN:       { label: "Administrador", color: "text-purple-700", bg: "bg-purple-100" },
  OPERADOR:    { label: "Usuário",       color: "text-blue-700",   bg: "bg-blue-100"   },
  GERENTE:     { label: "Usuário",       color: "text-blue-700",   bg: "bg-blue-100"   },
  VISUALIZADOR:{ label: "Usuário",       color: "text-blue-700",   bg: "bg-blue-100"   },
};

export default async function UsuariosPage() {
  const session = await auth();
  const user = session?.user as any;
  if (!session?.user) redirect("/login");
  if (user?.perfil !== "ADMIN") redirect("/dashboard");

  const escritorioId = user.escritorioId as string;

  const usuarios = await db.usuario.findMany({
    where: { escritorioId },
    select: {
      id: true,
      nome: true,
      email: true,
      perfil: true,
      permissoes: true,
      ativo: true,
      ultimoAcesso: true,
    },
    orderBy: [{ perfil: "asc" }, { nome: "asc" }],
  });

  return (
    <>
      <Header title="Usuários e Perfis" subtitle="Gerencie os usuários e suas permissões de acesso" />
      <div className="flex-1 p-3 sm:p-6">

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <p className="text-sm text-gray-500">
            {usuarios.length} usuário{usuarios.length !== 1 ? "s" : ""} cadastrado{usuarios.length !== 1 ? "s" : ""}
          </p>
          <Link
            href="/configuracoes/usuarios/novo"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Usuário
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Usuário</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Perfil</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Permissões</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Último acesso</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usuarios.map((u) => {
                const p = PERFIL_LABEL[u.perfil] ?? PERFIL_LABEL.OPERADOR;
                const perms = Array.isArray(u.permissoes) ? (u.permissoes as string[]) : [];
                const isAdmin = u.perfil === "ADMIN";
                return (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isAdmin ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                          {u.nome.split(" ").filter(Boolean).map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{u.nome}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full w-fit ${p.bg} ${p.color}`}>
                        {isAdmin ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        {p.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {isAdmin ? (
                        <span className="text-xs text-purple-600 font-medium">Acesso total</span>
                      ) : (
                        <span className="text-xs text-gray-500">
                          {perms.length === 0
                            ? "Nenhuma permissão"
                            : `${perms.length} módulo${perms.length !== 1 ? "s" : ""}`}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {u.ativo ? (
                        <span className="flex items-center gap-1 text-xs text-green-700">
                          <CheckCircle className="w-3 h-3" /> Ativo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-red-600">
                          <XCircle className="w-3 h-3" /> Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500">
                      {u.ultimoAcesso ? (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(u.ultimoAcesso).toLocaleDateString("pt-BR")}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/configuracoes/usuarios/${u.id}`}
                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
          <div className="px-5 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Somente administradores podem gerenciar usuários e permissões.
            </p>
          </div>
        </div>

      </div>
    </>
  );
}
