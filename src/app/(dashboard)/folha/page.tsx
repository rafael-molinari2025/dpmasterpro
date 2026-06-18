import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import Link from "next/link";
import { Play, Download, Plus, AlertCircle, CheckCircle, Clock } from "lucide-react";
import FolhaLinhaAcoes from "./FolhaLinhaAcoes";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  EM_CALCULO: { label: "Em Cálculo", color: "text-blue-700 bg-blue-50", icon: Clock },
  ABERTA: { label: "Aberta", color: "text-amber-700 bg-amber-50", icon: Clock },
  FECHADA: { label: "Fechada", color: "text-green-700 bg-green-50", icon: CheckCircle },
};

export default async function FolhaPage({
  searchParams,
}: {
  searchParams: Promise<{ competencia?: string; empresaId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const escritorioId = (session.user as any).escritorioId as string;

  const hoje = new Date();
  const { competencia: compParam, empresaId } = await searchParams;
  const competencia = compParam ?? `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;

  const [folhas, empresas] = await Promise.all([
    db.folha.findMany({
      where: {
        empresa: { escritorioId },
        competencia,
        ...(empresaId && { empresaId }),
      },
      include: {
        empresa: { select: { razaoSocial: true, nomeFantasia: true } },
        guias: { select: { id: true }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.empresa.findMany({
      where: { escritorioId, ativa: true },
      select: { id: true, nomeFantasia: true, razaoSocial: true },
      orderBy: { razaoSocial: "asc" },
    }),
  ]);

  const totalProventos = folhas.reduce((s, f) => s + parseFloat(f.totalProventos.toString()), 0);
  const totalDescontos = folhas.reduce((s, f) => s + parseFloat(f.totalDescontos.toString()), 0);
  const totalLiquido = folhas.reduce((s, f) => s + parseFloat(f.totalLiquido.toString()), 0);
  const totalINSSEmpregado = folhas.reduce((s, f) => s + parseFloat(f.totalINSSEmpregado.toString()), 0);
  const totalINSSPatronal = folhas.reduce((s, f) => s + parseFloat(f.totalINSSPatronal.toString()), 0);
  const totalFGTS = folhas.reduce((s, f) => s + parseFloat(f.totalFGTS.toString()), 0);

  const [ano, mes] = competencia.split("-").map(Number);
  const label = new Date(ano, mes - 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const labelCap = label.charAt(0).toUpperCase() + label.slice(1);

  return (
    <>
      <Header title="Folha de Pagamento" subtitle={`Competência: ${labelCap}`} />
      <div className="flex-1 p-3 sm:p-6 space-y-6">

        <form method="GET" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <input
              type="month"
              name="competencia"
              defaultValue={competencia}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
            />
            <select
              name="empresaId"
              defaultValue={empresaId ?? ""}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
            >
              <option value="">Todas as empresas</option>
              {empresas.map((e) => (
                <option key={e.id} value={e.id}>{e.nomeFantasia ?? e.razaoSocial}</option>
              ))}
            </select>
            <button type="submit" className="px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm text-gray-600 hover:bg-gray-50 w-full sm:w-auto">
              Filtrar
            </button>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href={`/folha/processar${empresaId ? `?empresaId=${empresaId}` : ""}`}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors whitespace-nowrap"
            >
              <Play className="w-4 h-4" />
              Processar Folha
            </Link>
          </div>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-6 gap-3">
          {[
            { label: "Empresas", value: String(folhas.length) },
            { label: "Total Proventos", value: `R$ ${fmt(totalProventos)}` },
            { label: "Total Descontos", value: `R$ ${fmt(totalDescontos)}` },
            { label: "Total Líquido", value: `R$ ${fmt(totalLiquido)}` },
            { label: "INSS Total", value: `R$ ${fmt(totalINSSEmpregado + totalINSSPatronal)}` },
            { label: "FGTS", value: `R$ ${fmt(totalFGTS)}` },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-lg border border-gray-200 px-3 py-3">
              <p className="text-[11px] text-gray-500">{s.label}</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-sm">Folhas — {labelCap}</h2>
            <button className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
              <Plus className="w-3 h-3" />
              Lançamento Manual
            </button>
          </div>

          {folhas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-medium text-gray-700 mb-1">Nenhuma folha processada</h3>
              <p className="text-sm text-gray-500 max-w-sm">
                Clique em "Processar Folha" para calcular proventos e descontos de {labelCap}.
              </p>
              <Link
                href="/folha/processar"
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                <Play className="w-4 h-4" />
                Processar Folha
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full min-w-[650px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Empresa</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Tipo</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Proventos</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Descontos</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Líquido</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {folhas.map((f) => {
                  const s = statusConfig[f.status] ?? statusConfig["ABERTA"];
                  const StatusIcon = s.icon;
                  return (
                    <tr key={f.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4 text-sm text-gray-900 font-medium">
                        {f.empresa.nomeFantasia ?? f.empresa.razaoSocial}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">{f.tipo}</span>
                      </td>
                      <td className="px-5 py-4 text-sm text-right text-gray-900">
                        R$ {fmt(parseFloat(f.totalProventos.toString()))}
                      </td>
                      <td className="px-5 py-4 text-sm text-right text-red-700">
                        R$ {fmt(parseFloat(f.totalDescontos.toString()))}
                      </td>
                      <td className="px-5 py-4 text-sm text-right font-bold text-gray-900">
                        R$ {fmt(parseFloat(f.totalLiquido.toString()))}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full w-fit ${s.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {s.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <FolhaLinhaAcoes
                          folhaId={f.id}
                          status={f.status}
                          empresaId={f.empresaId}
                          competencia={f.competencia}
                          temGuias={(f as any).guias?.length > 0}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          )}
        </div>

      </div>
    </>
  );
}
