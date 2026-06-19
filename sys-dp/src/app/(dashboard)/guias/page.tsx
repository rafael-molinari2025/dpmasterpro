import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import Link from "next/link";
import { CheckCircle, Clock, AlertTriangle } from "lucide-react";
import GuiaLinhaAcoes from "./GuiaLinhaAcoes";

const tipoGuiaInfo: Record<string, { label: string; cor: string; vencimento: string }> = {
  GPS_INSS:     { label: "GPS — INSS",    cor: "bg-blue-50 text-blue-700 border-blue-200",     vencimento: "Dia 20 do mês seguinte" },
  DARF_IRRF:    { label: "DARF — IRRF",   cor: "bg-orange-50 text-orange-700 border-orange-200", vencimento: "Dia 20 do mês seguinte" },
  FGTS_DIGITAL: { label: "FGTS Digital",  cor: "bg-emerald-50 text-emerald-700 border-emerald-200", vencimento: "Dia 7 do mês seguinte" },
  DCTFWEB:      { label: "DCTFWeb",       cor: "bg-purple-50 text-purple-700 border-purple-200", vencimento: "Dia 15 do mês seguinte" },
  GPS_PATRONAL: { label: "GPS Patronal",  cor: "bg-blue-50 text-blue-700 border-blue-200",     vencimento: "Dia 20 do mês seguinte" },
};

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

export default async function GuiasPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; status?: string; competencia?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const escritorioId = (session.user as any).escritorioId as string;

  const { tipo, status, competencia } = await searchParams;

  const guias = await db.guiaPagamento.findMany({
    where: {
      empresa: { escritorioId },
      ...(tipo && { tipo: tipo as any }),
      ...(status && { status: status as any }),
      ...(competencia && { competencia }),
    },
    include: {
      empresa: { select: { razaoSocial: true, nomeFantasia: true } },
    },
    orderBy: { dataVencimento: "asc" },
    take: 100,
  });

  // Totais pendentes por tipo
  const totalByTipo: Record<string, number> = {};
  for (const g of guias) {
    if (g.status === "PENDENTE") {
      totalByTipo[g.tipo] = (totalByTipo[g.tipo] || 0) + parseFloat(g.valorTotal.toString());
    }
  }

  const pendentes = guias.filter((g) => g.status === "PENDENTE");
  const totalPendente = pendentes.reduce((s, g) => s + parseFloat(g.valorTotal.toString()), 0);

  return (
    <>
      <Header title="Guias de Pagamento" subtitle="GPS, DARF, FGTS Digital e DCTFWeb" />
      <div className="flex-1 p-3 sm:p-6 space-y-6">

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(tipoGuiaInfo)
            .filter(([t]) => t !== "GPS_PATRONAL")
            .map(([tipo, info]) => (
              <div key={tipo} className={`border rounded-xl p-4 ${info.cor}`}>
                <p className="text-xs font-semibold">{info.label}</p>
                <p className="text-[11px] mt-1 opacity-80">{info.vencimento}</p>
                <p className="text-lg font-bold mt-2">
                  {totalByTipo[tipo] ? `R$ ${fmt(totalByTipo[tipo])}` : "R$ 0,00"}
                </p>
              </div>
            ))}
        </div>

        {/* Filters */}
        <form method="GET" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0 flex-1">
            <select
              name="tipo"
              defaultValue={tipo ?? ""}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
            >
              <option value="">Todas as guias</option>
              <option value="GPS_INSS">GPS — INSS</option>
              <option value="DARF_IRRF">DARF — IRRF</option>
              <option value="FGTS_DIGITAL">FGTS Digital</option>
              <option value="DCTFWEB">DCTFWeb</option>
            </select>
            <select
              name="status"
              defaultValue={status ?? ""}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
            >
              <option value="">Todos os status</option>
              <option value="PENDENTE">Pendente</option>
              <option value="PAGO">Pago</option>
              <option value="VENCIDA">Vencida</option>
            </select>
            <input
              type="month"
              name="competencia"
              defaultValue={competencia ?? ""}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
            />
            <button
              type="submit"
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 w-full sm:w-auto"
            >
              Filtrar
            </button>
          </div>
          <Link
            href="/folha/processar"
            className="flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            Gerar via Folha
          </Link>
        </form>

        {/* Table */}
        {guias.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 text-center py-16">
            <p className="text-gray-500 font-medium">Nenhuma guia encontrada</p>
            <p className="text-sm text-gray-400 mt-1">
              As guias são geradas automaticamente ao processar a folha de pagamento.
            </p>
            <Link
              href="/folha/processar"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              Processar Folha
            </Link>
          </div>
        ) : (
          <>
            {/* Cards (mobile) */}
            <div className="sm:hidden space-y-3">
              {guias.map((g) => {
                const info = tipoGuiaInfo[g.tipo] ?? { label: g.tipo, cor: "bg-gray-50 text-gray-700 border-gray-200" };
                const [ano, mes] = g.competencia.split("-");
                return (
                  <div key={g.id} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full border ${info.cor}`}>
                          {info.label}
                        </span>
                        <p className="text-sm font-medium text-gray-800 mt-2 truncate">
                          {g.empresa.nomeFantasia ?? g.empresa.razaoSocial}
                        </p>
                      </div>
                      {g.status === "PAGO" ? (
                        <span className="flex-shrink-0 flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full">
                          <CheckCircle className="w-3 h-3" /> Pago
                        </span>
                      ) : g.status === "VENCIDA" ? (
                        <span className="flex-shrink-0 flex items-center gap-1 text-xs text-red-700 bg-red-50 px-2 py-1 rounded-full">
                          <AlertTriangle className="w-3 h-3" /> Vencida
                        </span>
                      ) : (
                        <span className="flex-shrink-0 flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
                          <Clock className="w-3 h-3" /> Pendente
                        </span>
                      )}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <p><span className="text-gray-400">Competência:</span> {mes}/{ano}</p>
                      <p><span className="text-gray-400">Vencimento:</span> {g.dataVencimento.toLocaleDateString("pt-BR")}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-base font-bold text-gray-900">R$ {fmt(parseFloat(g.valorTotal.toString()))}</p>
                      <GuiaLinhaAcoes guiaId={g.id} status={g.status} />
                    </div>
                  </div>
                );
              })}
              <p className="text-xs text-gray-400 text-center pt-1">
                {guias.length} guia{guias.length !== 1 ? "s" : ""}
                {totalPendente > 0 && ` • ${pendentes.length} pendente${pendentes.length !== 1 ? "s" : ""}: R$ ${fmt(totalPendente)}`}
              </p>
            </div>

            {/* Tabela (tablet/desktop) */}
            <div className="hidden sm:block bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Tipo</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Empresa</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Competência</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Vencimento</th>
                      <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Valor</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {guias.map((g) => {
                      const info = tipoGuiaInfo[g.tipo] ?? { label: g.tipo, cor: "bg-gray-50 text-gray-700 border-gray-200" };
                      const [ano, mes] = g.competencia.split("-");
                      return (
                        <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-4">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full border ${info.cor}`}>
                              {info.label}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-700 max-w-[200px]">
                            <span className="truncate block">
                              {g.empresa.nomeFantasia ?? g.empresa.razaoSocial}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-600">{mes}/{ano}</td>
                          <td className="px-5 py-4 text-sm text-gray-600">
                            {g.dataVencimento.toLocaleDateString("pt-BR")}
                          </td>
                          <td className="px-5 py-4 text-sm font-bold text-right text-gray-900">
                            R$ {fmt(parseFloat(g.valorTotal.toString()))}
                          </td>
                          <td className="px-5 py-4">
                            {g.status === "PAGO" ? (
                              <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full w-fit">
                                <CheckCircle className="w-3 h-3" /> Pago
                              </span>
                            ) : g.status === "VENCIDA" ? (
                              <span className="flex items-center gap-1 text-xs text-red-700 bg-red-50 px-2 py-1 rounded-full w-fit">
                                <AlertTriangle className="w-3 h-3" /> Vencida
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-full w-fit">
                                <Clock className="w-3 h-3" /> Pendente
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <GuiaLinhaAcoes guiaId={g.id} status={g.status} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-500">{guias.length} guia{guias.length !== 1 ? "s" : ""} encontrada{guias.length !== 1 ? "s" : ""}</p>
                {totalPendente > 0 && (
                  <p className="text-xs text-amber-700 font-medium">
                    {pendentes.length} pendente{pendentes.length !== 1 ? "s" : ""} • Total: R$ {fmt(totalPendente)}
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-sm font-medium text-emerald-800 mb-1">FGTS Digital 2026 — Exclusivo PIX</p>
          <p className="text-xs text-emerald-700">
            A partir de 2026, o pagamento do FGTS Digital é realizado exclusivamente via PIX instantâneo.
            O código PIX é gerado automaticamente após o processamento da folha.
          </p>
        </div>

      </div>
    </>
  );
}
