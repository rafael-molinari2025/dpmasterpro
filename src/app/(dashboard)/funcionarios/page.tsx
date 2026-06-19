import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import { Plus, Search, Settings, Users } from "lucide-react";
import Link from "next/link";

const situacaoStyle: Record<string, string> = {
  ATIVO: "bg-green-50 text-green-700",
  FERIAS: "bg-blue-50 text-blue-700",
  AFASTADO: "bg-amber-50 text-amber-700",
  DEMITIDO: "bg-red-50 text-red-700",
};

const situacaoLabel: Record<string, string> = {
  ATIVO: "Ativo",
  FERIAS: "Férias",
  AFASTADO: "Afastado",
  DEMITIDO: "Demitido",
};

function mascaraCPF(cpf: string) {
  return cpf.replace(/(\d{3})\.\d{3}\.\d{3}-(\d{2})/, "$1.***.***-$2");
}

export default async function FuncionariosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; situacao?: string; empresaId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const escritorioId = (session.user as any).escritorioId as string;
  const { q, situacao, empresaId } = await searchParams;

  const [funcionarios, empresas] = await Promise.all([
    db.funcionario.findMany({
      where: {
        empresa: { escritorioId },
        ...(empresaId && { empresaId }),
        ...(situacao && { situacao: situacao as any }),
        ...(q && {
          OR: [
            { nome: { contains: q, mode: "insensitive" } },
            { cpf: { contains: q } },
            { matricula: { contains: q } },
          ],
        }),
      },
      include: {
        cargo: { select: { descricao: true } },
        setor: { select: { descricao: true } },
        empresa: { select: { nomeFantasia: true, razaoSocial: true } },
      },
      orderBy: { nome: "asc" },
    }),
    db.empresa.findMany({
      where: { escritorioId, ativa: true },
      select: { id: true, nomeFantasia: true, razaoSocial: true },
      orderBy: { razaoSocial: "asc" },
    }),
  ]);

  const countAtivos = funcionarios.filter((f) => f.situacao === "ATIVO").length;
  const countFerias = funcionarios.filter((f) => f.situacao === "FERIAS").length;
  const countAfastados = funcionarios.filter((f) => f.situacao === "AFASTADO").length;

  return (
    <>
      <Header title="Funcionários" subtitle="Cadastro e gestão de colaboradores" />
      <div className="flex-1 p-3 sm:p-6">

        <form method="GET" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap min-w-0 flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                name="q"
                defaultValue={q ?? ""}
                placeholder="Buscar funcionário..."
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
              />
            </div>
            <select
              name="empresaId"
              defaultValue={empresaId ?? ""}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
            >
              <option value="">Todas as empresas</option>
              {empresas.map((e) => (
                <option key={e.id} value={e.id}>{e.nomeFantasia ?? e.razaoSocial}</option>
              ))}
            </select>
            <select
              name="situacao"
              defaultValue={situacao ?? ""}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
            >
              <option value="">Todas as situações</option>
              <option value="ATIVO">Ativo</option>
              <option value="FERIAS">Férias</option>
              <option value="AFASTADO">Afastado</option>
              <option value="DEMITIDO">Demitido</option>
            </select>
            <button type="submit" className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 w-full sm:w-auto">
              Buscar
            </button>
          </div>
          <a
            href="/funcionarios/novo"
            className="flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Funcionário
          </a>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Ativos", value: countAtivos, color: "text-green-600" },
            { label: "Em Férias", value: countFerias, color: "text-blue-600" },
            { label: "Afastados", value: countAfastados, color: "text-amber-600" },
            { label: "Total", value: funcionarios.length, color: "text-gray-900" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-lg border border-gray-200 px-4 py-3 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        {funcionarios.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 text-center py-16">
            <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nenhum funcionário encontrado</p>
            <p className="text-sm text-gray-400 mt-1">Ajuste os filtros ou cadastre um novo funcionário.</p>
          </div>
        ) : (
          <>
            {/* Cards (mobile) */}
            <div className="sm:hidden space-y-3">
              {funcionarios.map((f) => (
                <div key={f.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold flex-shrink-0">
                        {f.nome.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{f.nome}</p>
                        <p className="text-xs text-gray-400">{mascaraCPF(f.cpf)}</p>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">Matr. {f.matricula}</p>
                      </div>
                    </div>
                    <Link
                      href={`/funcionarios/${f.id}`}
                      className="flex-shrink-0 flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 px-2 py-1.5 rounded-lg border border-gray-200 hover:border-blue-200 hover:bg-blue-50 transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Editar
                    </Link>
                  </div>
                  <div className="mt-3 space-y-1.5 text-xs text-gray-600">
                    <p><span className="text-gray-400">Cargo:</span> {f.cargo?.descricao ?? "—"}</p>
                    <p><span className="text-gray-400">Setor:</span> {f.setor?.descricao ?? "—"}</p>
                    <p><span className="text-gray-400">Empresa:</span> {f.empresa.nomeFantasia ?? f.empresa.razaoSocial}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-900">
                      R$ {parseFloat(f.salario.toString()).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${situacaoStyle[f.situacao] ?? "bg-gray-100 text-gray-600"}`}>
                      {situacaoLabel[f.situacao] ?? f.situacao}
                    </span>
                  </div>
                </div>
              ))}
              <p className="text-xs text-gray-400 text-center pt-1">
                {funcionarios.length} funcionário{funcionarios.length !== 1 ? "s" : ""} encontrado{funcionarios.length !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Tabela (tablet/desktop) */}
            <div className="hidden sm:block bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Matrícula</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Funcionário</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Cargo / Setor</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Empresa</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Salário</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Situação</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {funcionarios.map((f) => (
                    <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 text-sm font-mono text-gray-500">{f.matricula}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold flex-shrink-0">
                            {f.nome.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{f.nome}</p>
                            <p className="text-xs text-gray-400">{mascaraCPF(f.cpf)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-800">{f.cargo?.descricao ?? "—"}</p>
                        <p className="text-xs text-gray-500">{f.setor?.descricao ?? "—"}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">
                        {f.empresa.nomeFantasia ?? f.empresa.razaoSocial}
                      </td>
                      <td className="px-5 py-4 text-sm text-right font-medium text-gray-900">
                        R$ {parseFloat(f.salario.toString()).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${situacaoStyle[f.situacao] ?? "bg-gray-100 text-gray-600"}`}>
                          {situacaoLabel[f.situacao] ?? f.situacao}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/funcionarios/${f.id}`}
                          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 px-2 py-1.5 rounded-lg border border-gray-200 hover:border-blue-200 hover:bg-blue-50 transition-colors"
                        >
                          <Settings className="w-3.5 h-3.5" />
                          Editar
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              <div className="px-5 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">{funcionarios.length} funcionário{funcionarios.length !== 1 ? "s" : ""} encontrado{funcionarios.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
          </>
        )}

      </div>
    </>
  );
}
