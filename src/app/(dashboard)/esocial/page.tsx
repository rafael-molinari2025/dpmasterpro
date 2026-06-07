import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import { Send, RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle, Eye, RotateCcw } from "lucide-react";

const statusConfig: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  PENDENTE: { label: "Pendente", icon: Clock, color: "text-amber-700", bg: "bg-amber-50" },
  ENVIADO: { label: "Enviado", icon: CheckCircle, color: "text-green-700", bg: "bg-green-50" },
  ERRO: { label: "Erro", icon: XCircle, color: "text-red-700", bg: "bg-red-50" },
  REJEITADO: { label: "Rejeitado", icon: AlertTriangle, color: "text-red-700", bg: "bg-red-50" },
  ENVIANDO: { label: "Enviando...", icon: RefreshCw, color: "text-blue-700", bg: "bg-blue-50" },
};

const ambiente = process.env.ESOCIAL_AMBIENTE === "1" ? "Produção" : "Homologação";

export default async function ESocialPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; tipo?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const escritorioId = (session.user as any).escritorioId as string;
  const { status, tipo } = await searchParams;

  const eventos = await db.eventoEsocial.findMany({
    where: {
      empresa: { escritorioId },
      ...(status && { status }),
      ...(tipo && { tipoEvento: tipo }),
    },
    include: { empresa: { select: { razaoSocial: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const countPendente = eventos.filter((e) => e.status === "PENDENTE").length;
  const countEnviado = eventos.filter((e) => e.status === "ENVIADO").length;
  const countErro = eventos.filter((e) => e.status === "ERRO").length;

  return (
    <>
      <Header title="eSocial" subtitle="Envio e monitoramento de eventos — Versão S-1.3" />
      <div className="flex-1 p-6 space-y-6">

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Pendentes", value: countPendente, color: "text-amber-600" },
            { label: "Enviados", value: countEnviado, color: "text-green-600" },
            { label: "Com Erro", value: countErro, color: "text-red-600" },
            { label: "Total", value: eventos.length, color: "text-gray-900" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-lg border border-gray-200 px-4 py-3 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        <form method="GET" className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <select
              name="tipo"
              defaultValue={tipo ?? ""}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-600"
            >
              <option value="">Todos os eventos</option>
              <option value="S-1010">S-1010 — Rubricas</option>
              <option value="S-1200">S-1200 — Remuneração</option>
              <option value="S-1299">S-1299 — Fechamento</option>
              <option value="S-2200">S-2200 — Admissão</option>
              <option value="S-2299">S-2299 — Desligamento</option>
            </select>
            <select
              name="status"
              defaultValue={status ?? ""}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-600"
            >
              <option value="">Todos os status</option>
              <option value="PENDENTE">Pendente</option>
              <option value="ENVIADO">Enviado</option>
              <option value="ERRO">Erro</option>
            </select>
            <button type="submit" className="px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Filtrar
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              <RefreshCw className="w-4 h-4" />
              Atualizar Status
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
              <Send className="w-4 h-4" />
              Enviar Pendentes
            </button>
          </div>
        </form>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {eventos.length === 0 ? (
            <div className="text-center py-16">
              <Send className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Nenhum evento eSocial encontrado</p>
              <p className="text-sm text-gray-400 mt-1">Os eventos são gerados ao processar folhas e admissões.</p>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Evento</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Empresa</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Referência</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Protocolo</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Gerado em</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {eventos.map((ev) => {
                    const s = statusConfig[ev.status] ?? statusConfig["PENDENTE"];
                    const StatusIcon = s.icon;
                    return (
                      <tr key={ev.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4">
                          <div>
                            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                              {ev.tipoEvento}
                            </span>
                            <p className="text-sm text-gray-800 mt-1">{ev.descricao}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600 max-w-[200px]">
                          <span className="truncate block">{ev.empresa.razaoSocial}</span>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600">{ev.referencia ?? "—"}</td>
                        <td className="px-5 py-4">
                          <span className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full w-fit ${s.bg} ${s.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {s.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs font-mono text-gray-500">
                          {ev.protocolo ?? "—"}
                        </td>
                        <td className="px-5 py-4 text-xs text-gray-500">
                          {ev.createdAt.toLocaleString("pt-BR")}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1">
                            <button className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {ev.status === "ERRO" && (
                              <button className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-amber-600 hover:bg-amber-50">
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-500">{eventos.length} eventos • Ambiente: {ambiente}</p>
                <p className="text-xs text-gray-400">Versão do leiaute: S-1.3</p>
              </div>
            </>
          )}
        </div>

        <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 text-sm mb-3">Ordem Correta de Envio eSocial</h3>
          <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600">
            {["S-1000", "S-1005", "S-1010", "S-1020", "→", "S-2200/S-2300", "→", "S-1200/S-1210", "S-1280", "→", "S-1299 (último)"].map((item, i) => (
              item === "→" ? (
                <span key={i} className="text-slate-400 font-bold">{item}</span>
              ) : (
                <span key={i} className="font-mono bg-white border border-slate-200 px-2 py-0.5 rounded">
                  {item}
                </span>
              )
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
