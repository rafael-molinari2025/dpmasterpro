import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import ESocialAcoes from "./ESocialAcoes";
import ESocialLinhaAcoes from "./ESocialLinhaAcoes";
import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";

const statusConfig: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  PENDENTE:  { label: "Pendente",   icon: Clock,         color: "text-amber-700", bg: "bg-amber-50"  },
  ENVIANDO:  { label: "Enviando…",  icon: Clock,         color: "text-blue-700",  bg: "bg-blue-50"   },
  ENVIADO:   { label: "Enviado",    icon: CheckCircle,   color: "text-green-700", bg: "bg-green-50"  },
  ERRO:      { label: "Erro",       icon: XCircle,       color: "text-red-700",   bg: "bg-red-50"    },
  REJEITADO: { label: "Rejeitado",  icon: AlertTriangle, color: "text-red-700",   bg: "bg-red-50"    },
};

const ambiente = process.env.ESOCIAL_AMBIENTE === "1" ? "Produção" : "Homologação";
const modoDemo = !process.env.ESOCIAL_CERT_BASE64;

export default async function ESocialPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; tipo?: string; empresaId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const escritorioId = (session.user as any).escritorioId as string;
  const { status, tipo, empresaId: filtroEmpresa } = await searchParams;

  const [eventos, empresas] = await Promise.all([
    db.eventoEsocial.findMany({
      where: {
        empresa: { escritorioId },
        ...(filtroEmpresa && { empresaId: filtroEmpresa }),
        ...(status && { status }),
        ...(tipo && { tipoEvento: tipo }),
      },
      include: { empresa: { select: { razaoSocial: true, nomeFantasia: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.empresa.findMany({
      where: { escritorioId, ativa: true },
      select: { id: true, razaoSocial: true, nomeFantasia: true },
      orderBy: { razaoSocial: "asc" },
    }),
  ]);

  const countPendente = eventos.filter((e) => e.status === "PENDENTE").length;
  const countEnviado  = eventos.filter((e) => e.status === "ENVIADO").length;
  const countErro     = eventos.filter((e) => ["ERRO", "REJEITADO"].includes(e.status)).length;

  return (
    <>
      <Header title="eSocial" subtitle={`Envio e monitoramento de eventos — S-1.3 • ${ambiente}`} />
      <div className="flex-1 p-3 sm:p-6 space-y-6">

        {/* Contadores */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Pendentes", value: countPendente, color: "text-amber-600" },
            { label: "Enviados",  value: countEnviado,  color: "text-green-600" },
            { label: "Com Erro",  value: countErro,     color: "text-red-600"   },
            { label: "Total",     value: eventos.length, color: "text-gray-900" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-lg border border-gray-200 px-4 py-3 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filtros + Ações */}
        <div className="flex flex-col gap-3">
          <form method="GET" className="flex flex-col sm:flex-row sm:items-center gap-2 flex-wrap">
            <select
              name="empresaId"
              defaultValue={filtroEmpresa ?? ""}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-600 w-full sm:w-auto"
            >
              <option value="">Todas as empresas</option>
              {empresas.map((e) => (
                <option key={e.id} value={e.id}>{e.nomeFantasia ?? e.razaoSocial}</option>
              ))}
            </select>
            <select
              name="tipo"
              defaultValue={tipo ?? ""}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-600 w-full sm:w-auto"
            >
              <option value="">Todos os eventos</option>
              {["S-1000","S-1010","S-1200","S-1299","S-2200","S-2299"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select
              name="status"
              defaultValue={status ?? ""}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-600 w-full sm:w-auto"
            >
              <option value="">Todos os status</option>
              <option value="PENDENTE">Pendente</option>
              <option value="ENVIADO">Enviado</option>
              <option value="ERRO">Erro</option>
            </select>
            <button type="submit" className="px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm text-gray-600 hover:bg-gray-50 w-full sm:w-auto">
              Filtrar
            </button>
          </form>

          <ESocialAcoes
            empresas={empresas}
            qtdPendente={countPendente}
            modoDemo={modoDemo}
          />
        </div>

        {/* Tabela de eventos */}
        {eventos.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 text-center py-16">
            <p className="text-gray-500 font-medium">Nenhum evento eSocial encontrado</p>
            <p className="text-sm text-gray-400 mt-1">
              Os eventos são gerados ao processar folhas, admissões e configurações.
            </p>
          </div>
        ) : (
          <>
            {/* Cards (mobile) */}
            <div className="sm:hidden space-y-3">
              {eventos.map((ev) => {
                const s = statusConfig[ev.status] ?? statusConfig["PENDENTE"];
                const StatusIcon = s.icon;
                return (
                  <div key={ev.id} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="flex-shrink-0 text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {ev.tipoEvento}
                        </span>
                        <span className={`flex-shrink-0 flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {s.label}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-gray-600">
                      <p className="font-medium text-gray-800 truncate">{ev.descricao}</p>
                      <p><span className="text-gray-400">Empresa:</span> {ev.empresa.nomeFantasia ?? ev.empresa.razaoSocial}</p>
                      {ev.protocolo && <p><span className="text-gray-400">Protocolo:</span> <span className="font-mono">{ev.protocolo}</span></p>}
                      <p><span className="text-gray-400">Gerado em:</span> {ev.createdAt.toLocaleString("pt-BR")}</p>
                    </div>
                    <div className="mt-3">
                      <ESocialLinhaAcoes
                        eventoId={ev.id}
                        status={ev.status}
                        xmlGerado={ev.xmlGerado}
                        tipoEvento={ev.tipoEvento}
                        descricao={ev.descricao}
                      />
                    </div>
                  </div>
                );
              })}
              <p className="text-xs text-gray-400 text-center pt-1">
                {eventos.length} evento{eventos.length !== 1 ? "s" : ""} • {ambiente}{modoDemo && " • Demo"}
              </p>
            </div>

            {/* Tabela (tablet/desktop) */}
            <div className="hidden sm:block bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full min-w-[750px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Evento</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Empresa</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Descrição</th>
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
                          <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                            {ev.tipoEvento}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600 max-w-[160px]">
                          <span className="truncate block">
                            {ev.empresa.nomeFantasia ?? ev.empresa.razaoSocial}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-800 max-w-[260px]">
                          <span className="truncate block">{ev.descricao}</span>
                        </td>
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
                          <ESocialLinhaAcoes
                            eventoId={ev.id}
                            status={ev.status}
                            xmlGerado={ev.xmlGerado}
                            tipoEvento={ev.tipoEvento}
                            descricao={ev.descricao}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  {eventos.length} evento{eventos.length !== 1 ? "s" : ""} • Ambiente: {ambiente}
                  {modoDemo && " • Modo Demonstração"}
                </p>
                <p className="text-xs text-gray-400">Leiaute S-1.3</p>
              </div>
            </div>
          </>
        )}

        {/* Ordem de envio */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 text-sm mb-3">Ordem Correta de Envio eSocial</h3>
          <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600">
            {["S-1000","S-1010","→","S-2200","→","S-1200","S-1299"].map((item, i) => (
              item === "→"
                ? <span key={i} className="text-slate-400 font-bold">{item}</span>
                : <span key={i} className="font-mono bg-white border border-slate-200 px-2 py-0.5 rounded">{item}</span>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            S-1000 (empregador) → S-1010 (rubricas) → S-2200 (admissão) → S-1200 (remuneração) → S-1299 (fechamento)
          </p>
        </div>

      </div>
    </>
  );
}
