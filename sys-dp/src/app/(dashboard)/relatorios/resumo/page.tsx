import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import { BarChart3, Download, FileText } from "lucide-react";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function ResumoFolhaPage({
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

  const [empresas, folhas] = await Promise.all([
    db.empresa.findMany({
      where: { escritorioId, ativa: true },
      select: { id: true, nomeFantasia: true, razaoSocial: true },
      orderBy: { razaoSocial: "asc" },
    }),
    db.folha.findMany({
      where: {
        empresa: { escritorioId },
        competencia,
        ...(empresaId && { empresaId }),
      },
      include: { empresa: { select: { razaoSocial: true, nomeFantasia: true } } },
      orderBy: { empresa: { razaoSocial: "asc" } },
    }),
  ]);

  const totals = folhas.reduce(
    (acc, f) => ({
      proventos: acc.proventos + parseFloat(f.totalProventos.toString()),
      descontos: acc.descontos + parseFloat(f.totalDescontos.toString()),
      liquido: acc.liquido + parseFloat(f.totalLiquido.toString()),
      inssEmpregado: acc.inssEmpregado + parseFloat(f.totalINSSEmpregado.toString()),
      inssPatronal: acc.inssPatronal + parseFloat(f.totalINSSPatronal.toString()),
      fgts: acc.fgts + parseFloat(f.totalFGTS.toString()),
      irrf: acc.irrf + parseFloat(f.totalIRRF.toString()),
    }),
    { proventos: 0, descontos: 0, liquido: 0, inssEmpregado: 0, inssPatronal: 0, fgts: 0, irrf: 0 }
  );

  const [ano, mes] = competencia.split("-").map(Number);
  const label = new Date(ano, mes - 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const labelCap = label.charAt(0).toUpperCase() + label.slice(1);

  return (
    <>
      <Header title="Resumo da Folha" subtitle={`Consolidado ${labelCap}`} />
      <div className="flex-1 p-6 space-y-6">

        <form method="GET" className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <input
              type="month"
              name="competencia"
              defaultValue={competencia}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
            <button type="submit" className="px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Gerar
            </button>
          </div>
          <button type="button" className="flex items-center gap-2 px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            <Download className="w-4 h-4" />
            Exportar PDF
          </button>
        </form>

        {folhas.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Total Proventos", value: `R$ ${fmt(totals.proventos)}`, color: "text-gray-900" },
                { label: "Total Descontos", value: `R$ ${fmt(totals.descontos)}`, color: "text-red-700" },
                { label: "Total Líquido", value: `R$ ${fmt(totals.liquido)}`, color: "text-green-700" },
                { label: "Encargos Patronais (INSS+FGTS)", value: `R$ ${fmt(totals.inssPatronal + totals.fgts)}`, color: "text-amber-700" },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className={`text-lg font-bold mt-1 ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Resumo por Empresa — {labelCap}</h2>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Empresa</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Proventos</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Descontos</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Líquido</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">INSS Patronal</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">FGTS</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">IRRF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {folhas.map((f) => (
                    <tr key={f.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-sm font-medium text-gray-900">
                        {f.empresa.nomeFantasia ?? f.empresa.razaoSocial}
                      </td>
                      <td className="px-5 py-3 text-sm text-right text-gray-900">R$ {fmt(parseFloat(f.totalProventos.toString()))}</td>
                      <td className="px-5 py-3 text-sm text-right text-red-700">R$ {fmt(parseFloat(f.totalDescontos.toString()))}</td>
                      <td className="px-5 py-3 text-sm text-right font-bold text-green-700">R$ {fmt(parseFloat(f.totalLiquido.toString()))}</td>
                      <td className="px-5 py-3 text-sm text-right text-gray-700">R$ {fmt(parseFloat(f.totalINSSPatronal.toString()))}</td>
                      <td className="px-5 py-3 text-sm text-right text-gray-700">R$ {fmt(parseFloat(f.totalFGTS.toString()))}</td>
                      <td className="px-5 py-3 text-sm text-right text-gray-700">R$ {fmt(parseFloat(f.totalIRRF.toString()))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td className="px-5 py-3 text-xs font-medium text-gray-700">TOTAL GERAL</td>
                    <td className="px-5 py-3 text-sm text-right font-bold text-gray-900">R$ {fmt(totals.proventos)}</td>
                    <td className="px-5 py-3 text-sm text-right font-bold text-red-700">R$ {fmt(totals.descontos)}</td>
                    <td className="px-5 py-3 text-sm text-right font-bold text-green-700">R$ {fmt(totals.liquido)}</td>
                    <td className="px-5 py-3 text-sm text-right font-bold text-gray-700">R$ {fmt(totals.inssPatronal)}</td>
                    <td className="px-5 py-3 text-sm text-right font-bold text-gray-700">R$ {fmt(totals.fgts)}</td>
                    <td className="px-5 py-3 text-sm text-right font-bold text-gray-700">R$ {fmt(totals.irrf)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}

        {folhas.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 text-center py-20">
            <BarChart3 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nenhuma folha processada para {labelCap}</p>
            <a href="/folha" className="mt-2 inline-block text-sm text-blue-600 hover:underline">Processar folha →</a>
          </div>
        )}

      </div>
    </>
  );
}
