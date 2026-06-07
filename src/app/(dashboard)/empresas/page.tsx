import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import { Building2, Plus, Search, CheckCircle, XCircle, Settings } from "lucide-react";
import Link from "next/link";

export default async function EmpresasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const escritorioId = (session.user as any).escritorioId as string;
  const { q } = await searchParams;

  const empresas = await db.empresa.findMany({
    where: {
      escritorioId,
      ...(q && {
        OR: [
          { razaoSocial: { contains: q, mode: "insensitive" } },
          { nomeFantasia: { contains: q, mode: "insensitive" } },
          { cnpj: { contains: q } },
        ],
      }),
    },
    include: { _count: { select: { funcionarios: true } } },
    orderBy: { razaoSocial: "asc" },
  });

  const regimeLabel: Record<string, string> = {
    SIMPLES_NACIONAL: "Simples Nacional",
    LUCRO_PRESUMIDO: "Lucro Presumido",
    LUCRO_REAL: "Lucro Real",
    MEI: "MEI",
  };

  return (
    <>
      <Header title="Empresas" subtitle="Gestão das empresas clientes do escritório" />
      <div className="flex-1 p-6">

        <form method="GET" className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                name="q"
                defaultValue={q ?? ""}
                placeholder="Buscar empresa..."
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              Buscar
            </button>
          </div>
          <a
            href="/empresas/nova"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Empresa
          </a>
        </form>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {empresas.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">
                {q ? `Nenhuma empresa encontrada para "${q}"` : "Nenhuma empresa cadastrada"}
              </p>
              {!q && (
                <p className="text-sm text-gray-400 mt-1">Clique em "Nova Empresa" para começar.</p>
              )}
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Empresa</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">CNPJ</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Regime</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Funcionários</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {empresas.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                            {e.razaoSocial[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{e.razaoSocial}</p>
                            <p className="text-xs text-gray-500">{e.nomeFantasia ?? "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 font-mono">{e.cnpj}</td>
                      <td className="px-5 py-4">
                        <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                          {regimeLabel[e.regimeTributario] ?? e.regimeTributario}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {e._count.funcionarios}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {e.ativa ? (
                          <span className="flex items-center gap-1 text-xs text-green-700">
                            <CheckCircle className="w-3 h-3" /> Ativa
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-red-600">
                            <XCircle className="w-3 h-3" /> Inativa
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/empresas/${e.id}`}
                          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                        >
                          <Settings className="w-3.5 h-3.5" />
                          Editar
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-5 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  {empresas.length} empresa{empresas.length !== 1 ? "s" : ""} encontrada{empresas.length !== 1 ? "s" : ""}
                </p>
              </div>
            </>
          )}
        </div>

      </div>
    </>
  );
}
