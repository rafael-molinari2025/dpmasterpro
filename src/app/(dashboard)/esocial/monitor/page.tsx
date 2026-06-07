import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import { Activity, CheckCircle, XCircle, Clock, Send, AlertTriangle } from "lucide-react";

export default async function ESocialMonitorPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const escritorioId = (session.user as any).escritorioId as string;

  const [pendentes, enviados, erros, total] = await Promise.all([
    db.eventoEsocial.count({ where: { empresa: { escritorioId }, status: "PENDENTE" } }),
    db.eventoEsocial.count({ where: { empresa: { escritorioId }, status: "ENVIADO" } }),
    db.eventoEsocial.count({ where: { empresa: { escritorioId }, status: { in: ["ERRO", "REJEITADO"] } } }),
    db.eventoEsocial.count({ where: { empresa: { escritorioId } } }),
  ]);

  const ultimosEventos = await db.eventoEsocial.findMany({
    where: { empresa: { escritorioId } },
    include: { empresa: { select: { nomeFantasia: true, razaoSocial: true } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const ambiente = process.env.ESOCIAL_AMBIENTE === "1" ? "Produção" : "Homologação";
  const txEnvio = total > 0 ? Math.round((enviados / total) * 100) : 0;

  return (
    <>
      <Header title="Monitor eSocial" subtitle={`Ambiente: ${ambiente} — Status em tempo real`} />
      <div className="flex-1 p-6 space-y-6">

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Pendentes", value: pendentes, icon: Clock, color: "amber" },
            { label: "Enviados", value: enviados, icon: CheckCircle, color: "green" },
            { label: "Com Erro", value: erros, icon: XCircle, color: "red" },
            { label: "Total Geral", value: total, icon: Activity, color: "blue" },
          ].map((s) => {
            const Icon = s.icon;
            const colorMap: Record<string, string> = {
              amber: "text-amber-600 bg-amber-50",
              green: "text-green-600 bg-green-50",
              red: "text-red-600 bg-red-50",
              blue: "text-blue-600 bg-blue-50",
            };
            return (
              <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{s.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{s.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[s.color]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              Taxa de Envio
            </h3>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15.9" fill="none"
                    stroke={txEnvio >= 80 ? "#22c55e" : txEnvio >= 50 ? "#f59e0b" : "#ef4444"}
                    strokeWidth="3"
                    strokeDasharray={`${txEnvio} ${100 - txEnvio}`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900">
                  {txEnvio}%
                </span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p><span className="text-green-600 font-medium">{enviados}</span> enviados</p>
                <p><span className="text-amber-600 font-medium">{pendentes}</span> pendentes</p>
                <p><span className="text-red-600 font-medium">{erros}</span> com erro</p>
              </div>
            </div>
          </div>

          <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-600" />
                Últimos 10 Eventos
              </h3>
            </div>
            {ultimosEventos.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-400 text-sm">Nenhum evento registrado</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {ultimosEventos.map((ev) => {
                  const statusIcon = {
                    PENDENTE: <Clock className="w-3.5 h-3.5 text-amber-500" />,
                    ENVIADO: <CheckCircle className="w-3.5 h-3.5 text-green-500" />,
                    ERRO: <XCircle className="w-3.5 h-3.5 text-red-500" />,
                    REJEITADO: <AlertTriangle className="w-3.5 h-3.5 text-red-500" />,
                  }[ev.status] ?? <Clock className="w-3.5 h-3.5 text-gray-400" />;

                  return (
                    <div key={ev.id} className="flex items-center gap-3 px-5 py-3">
                      {statusIcon}
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">{ev.tipoEvento}</span>
                        <span className="ml-2 text-xs text-gray-600 truncate">{ev.empresa.nomeFantasia ?? ev.empresa.razaoSocial}</span>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {ev.createdAt.toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  );
}
