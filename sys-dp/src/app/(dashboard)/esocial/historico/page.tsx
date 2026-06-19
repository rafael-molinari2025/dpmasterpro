import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import { Send, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  PENDENTE: { label: "Pendente", color: "text-amber-700", bg: "bg-amber-50" },
  ENVIADO: { label: "Enviado", color: "text-green-700", bg: "bg-green-50" },
  ERRO: { label: "Erro", color: "text-red-700", bg: "bg-red-50" },
  REJEITADO: { label: "Rejeitado", color: "text-red-700", bg: "bg-red-50" },
};

export default async function ESocialHistoricoPage({
  searchParams,
}: {
  searchParams: Promise<{ empresaId?: string; tipo?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const escritorioId = (session.user as any).escritorioId as string;
  const { empresaId, tipo } = await searchParams;

  const [empresas, eventos] = await Promise.all([
    db.empresa.findMany({
      where: { escritorioId, ativa: true },
      select: { id: true, nomeFantasia: true, razaoSocial: true },
      orderBy: { razaoSocial: "asc" },
    }),
    db.eventoEsocial.findMany({
      where: {
        empresa: { escritorioId },
        status: { in: ["ENVIADO", "ERRO", "REJEITADO"] },
        ...(empresaId && { empresaId }),
        ...(tipo && { tipoEvento: tipo }),
      },
      include: { empresa: { select: { razaoSocial: true, nomeFantasia: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return (
    <>
      <Header title="Histórico de Envios eSocial" subtitle="Eventos enviados, com erro ou rejeitados" />
      <div className="flex-1 p-3 sm:p-6 space-y-6">

        <form method="GET" className="flex flex-wrap items-center gap-3">
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
          <select
            name="tipo"
            defaultValue={tipo ?? ""}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os tipos</option>
            <option value="S-1010">S-1010</option>
            <option value="S-1200">S-1200</option>
            <option value="S-1299">S-1299</option>
            <option value="S-2200">S-2200</option>
            <option value="S-2299">S-2299</option>
          </select>
          <button type="submit" className="px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            Filtrar
          </button>
        </form>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {eventos.length === 0 ? (
            <div className="text-center py-16">
              <Send className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Nenhum histórico de envio</p>
            </div>
          ) : (
            <>
              {/* Cards (mobile) */}
              <div className="sm:hidden divide-y divide-gray-100">
                {eventos.map((ev) => {
                  const s = statusConfig[ev.status] ?? statusConfig["PENDENTE"];
                  return (
                    <div key={ev.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{ev.tipoEvento}</span>
                          <p className="text-sm text-gray-800 mt-1 truncate">{ev.descricao}</p>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{ev.empresa.nomeFantasia ?? ev.empresa.razaoSocial}</p>
                        </div>
                        <span className={`flex-shrink-0 text-xs font-medium px-2 py-1 rounded-full ${s.bg} ${s.color}`}>{s.label}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
                        <span className="font-mono">{ev.protocolo ?? "—"}</span>
                        <span>{ev.createdAt.toLocaleString("pt-BR")}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Tabela (tablet/desktop) */}
              <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Evento</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Empresa</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Protocolo</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {eventos.map((ev) => {
                    const s = statusConfig[ev.status] ?? statusConfig["PENDENTE"];
                    return (
                      <tr key={ev.id} className="hover:bg-gray-50">
                        <td className="px-5 py-4">
                          <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{ev.tipoEvento}</span>
                          <p className="text-sm text-gray-800 mt-1">{ev.descricao}</p>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600">{ev.empresa.nomeFantasia ?? ev.empresa.razaoSocial}</td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${s.bg} ${s.color}`}>{s.label}</span>
                        </td>
                        <td className="px-5 py-4 text-xs font-mono text-gray-500">{ev.protocolo ?? "—"}</td>
                        <td className="px-5 py-4 text-xs text-gray-500">{ev.createdAt.toLocaleString("pt-BR")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
              <div className="px-5 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">{eventos.length} evento{eventos.length !== 1 ? "s" : ""} no histórico</p>
              </div>
            </>
          )}
        </div>

      </div>
    </>
  );
}
