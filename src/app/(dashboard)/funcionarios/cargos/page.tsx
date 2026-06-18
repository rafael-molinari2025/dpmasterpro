import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import { Briefcase, Users } from "lucide-react";
import CargosAcoes from "./CargosAcoes";

export default async function CargosPage({
  searchParams,
}: {
  searchParams: Promise<{ empresaId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const escritorioId = (session.user as any).escritorioId as string;
  const { empresaId } = await searchParams;

  const [empresas, cargos] = await Promise.all([
    db.empresa.findMany({
      where: { escritorioId, ativa: true },
      select: { id: true, nomeFantasia: true, razaoSocial: true },
      orderBy: { razaoSocial: "asc" },
    }),
    db.cargo.findMany({
      where: {
        empresa: {
          escritorioId,
          ...(empresaId && { id: empresaId }),
        },
      },
      include: {
        _count: { select: { funcionarios: true } },
        empresa: { select: { nomeFantasia: true, razaoSocial: true } },
      },
      orderBy: { descricao: "asc" },
    }),
  ]);

  return (
    <>
      <Header title="Cargos" subtitle="Plano de cargos e funções das empresas" />
      <div className="flex-1 p-6 space-y-6">

        <form method="GET" className="flex items-center justify-between">
          <select
            name="empresaId"
            defaultValue={empresaId ?? ""}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas as empresas</option>
            {empresas.map((e) => (
              <option key={e.id} value={e.id}>{e.nomeFantasia ?? e.razaoSocial}</option>
            ))}
          </select>
          <CargosAcoes empresas={empresas} />
        </form>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {cargos.length === 0 ? (
            <div className="text-center py-16">
              <Briefcase className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Nenhum cargo cadastrado</p>
              <p className="text-sm text-gray-400 mt-1">Os cargos são criados ao cadastrar funcionários.</p>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Cargo / Função</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Empresa</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">CBO</th>
                    <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Funcionários</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cargos.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <Briefcase className="w-4 h-4 text-purple-600" />
                          </div>
                          <p className="text-sm font-medium text-gray-900">{c.descricao}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">
                        {c.empresa.nomeFantasia ?? c.empresa.razaoSocial}
                      </td>
                      <td className="px-5 py-4 text-sm font-mono text-gray-500">{c.cbo ?? "—"}</td>
                      <td className="px-5 py-4 text-center">
                        <span className="flex items-center justify-center gap-1 text-sm text-gray-600">
                          <Users className="w-3 h-3" />
                          {c._count.funcionarios}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-5 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">{cargos.length} cargo{cargos.length !== 1 ? "s" : ""} cadastrado{cargos.length !== 1 ? "s" : ""}</p>
              </div>
            </>
          )}
        </div>

      </div>
    </>
  );
}
