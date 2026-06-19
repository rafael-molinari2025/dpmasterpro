import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import { Receipt, Info } from "lucide-react";
import CopiarPixButton from "../CopiarPixButton";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const statusLabel: Record<string, string> = { PENDENTE: "Pendente", PAGO: "Pago", VENCIDA: "Vencida" };
const statusStyle: Record<string, string> = {
  PENDENTE: "bg-amber-50 text-amber-700",
  PAGO: "bg-green-50 text-green-700",
  VENCIDA: "bg-red-50 text-red-700",
};

export default async function GuiasFGTSPage({
  searchParams,
}: {
  searchParams: Promise<{ empresaId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const escritorioId = (session.user as any).escritorioId as string;
  const { empresaId } = await searchParams;

  const [empresas, guias] = await Promise.all([
    db.empresa.findMany({
      where: { escritorioId, ativa: true },
      select: { id: true, nomeFantasia: true, razaoSocial: true },
      orderBy: { razaoSocial: "asc" },
    }),
    db.guiaPagamento.findMany({
      where: {
        tipo: "FGTS_DIGITAL",
        empresa: { escritorioId },
        ...(empresaId && { empresaId }),
      },
      include: { empresa: { select: { razaoSocial: true, nomeFantasia: true, cnpj: true } } },
      orderBy: { dataVencimento: "desc" },
      take: 50,
    }),
  ]);

  const totalPendente = guias.filter((g) => g.status === "PENDENTE").reduce((s, g) => s + parseFloat(g.valorTotal.toString()), 0);

  return (
    <>
      <Header title="FGTS Digital" subtitle="Recolhimento via Pix — FGTS Digital (gov.br)" />
      <div className="flex-1 p-3 sm:p-6 space-y-6">

        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3">
          <Info className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-800">
            <strong>Vencimento FGTS Digital:</strong> Até o dia 7 do mês subsequente à competência.
            O pagamento é feito <strong>exclusivamente via Pix</strong> usando a chave Pix copia e cola gerada pelo sistema FGTS Digital.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <form method="GET" className="flex items-center gap-2">
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
            <button type="submit" className="px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">Filtrar</button>
          </form>
          {totalPendente > 0 && (
            <div className="text-sm text-amber-700 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200">
              Total pendente: <strong>R$ {fmt(totalPendente)}</strong>
            </div>
          )}
        </div>

        {guias.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 text-center py-16">
            <Receipt className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nenhuma guia FGTS gerada</p>
            <p className="text-sm text-gray-400 mt-1">As guias são geradas ao processar a folha de pagamento.</p>
          </div>
        ) : (
          <>
            {/* Cards (mobile) */}
            <div className="sm:hidden space-y-3">
              {guias.map((g) => (
                <div key={g.id} className="bg-white rounded-xl border border-gray-200 p-4 overflow-hidden">
                  <div className="flex items-start gap-3">
                    <p className="flex-1 min-w-0 text-sm font-semibold text-gray-900 truncate">{g.empresa.nomeFantasia ?? g.empresa.razaoSocial}</p>
                    <span className={`shrink-0 text-xs px-2 py-1 rounded-full font-medium ${statusStyle[g.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {statusLabel[g.status] ?? g.status}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <p><span className="text-gray-400">Competência:</span> {g.competencia}</p>
                    <p><span className="text-gray-400">Vencimento:</span> {g.dataVencimento.toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-base font-bold text-gray-900">R$ {fmt(parseFloat(g.valorTotal.toString()))}</p>
                    {g.pixCopiaCola && <CopiarPixButton pixCopiaCola={g.pixCopiaCola} />}
                  </div>
                </div>
              ))}
              <p className="text-xs text-gray-400 text-center pt-1">{guias.length} guia{guias.length !== 1 ? "s" : ""} FGTS Digital</p>
            </div>

            {/* Tabela (tablet/desktop) */}
            <div className="hidden sm:block bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Empresa</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Competência</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Vencimento</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Valor FGTS</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Pix</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {guias.map((g) => (
                    <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 text-sm font-medium text-gray-900">
                        {g.empresa.nomeFantasia ?? g.empresa.razaoSocial}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">{g.competencia}</td>
                      <td className="px-5 py-4 text-sm text-gray-600">{g.dataVencimento.toLocaleDateString("pt-BR")}</td>
                      <td className="px-5 py-4 text-sm text-right font-bold text-gray-900">
                        R$ {fmt(parseFloat(g.valorTotal.toString()))}
                      </td>
                      <td className="px-5 py-4">
                        {g.pixCopiaCola ? (
                          <CopiarPixButton pixCopiaCola={g.pixCopiaCola} />
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusStyle[g.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {g.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              <div className="px-5 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">{guias.length} guia{guias.length !== 1 ? "s" : ""} FGTS Digital</p>
              </div>
            </div>
          </>
        )}

      </div>
    </>
  );
}
