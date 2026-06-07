import Header from "@/components/layout/Header";
import {
  Users, Calculator, Umbrella, Send, Receipt,
  AlertTriangle, CheckCircle, Clock, TrendingUp,
} from "lucide-react";

const stats = [
  { label: "Funcionários Ativos", value: "0", icon: Users, color: "blue", change: "+0" },
  { label: "Folhas do Mês", value: "0", icon: Calculator, color: "green", change: "R$ 0,00" },
  { label: "Férias a Vencer (30d)", value: "0", icon: Umbrella, color: "yellow", change: "0 vencidas" },
  { label: "Eventos eSocial", value: "0", icon: Send, color: "purple", change: "0 pendentes" },
];

const alertas = [
  { tipo: "warning", mensagem: "3 funcionários com férias vencidas", modulo: "Férias" },
  { tipo: "error", mensagem: "2 eventos eSocial com erro de envio", modulo: "eSocial" },
  { tipo: "info", mensagem: "Guia GPS vence em 5 dias", modulo: "Guias" },
  { tipo: "success", mensagem: "Folha de Maio/2026 fechada com sucesso", modulo: "Folha" },
];

const proximosVencimentos = [
  { descricao: "GPS — INSS Empregado/Empregador", data: "20/06/2026", valor: "R$ 0,00", status: "pendente" },
  { descricao: "DARF — IRRF", data: "20/06/2026", valor: "R$ 0,00", status: "pendente" },
  { descricao: "FGTS Digital", data: "07/07/2026", valor: "R$ 0,00", status: "pendente" },
  { descricao: "DCTFWeb", data: "15/07/2026", valor: "R$ 0,00", status: "pendente" },
];

export default function DashboardPage() {
  return (
    <>
      <Header title="Dashboard" subtitle="Visão geral do Departamento Pessoal" />
      <div className="flex-1 p-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const colors: Record<string, string> = {
              blue: "bg-blue-50 text-blue-600",
              green: "bg-green-50 text-green-600",
              yellow: "bg-amber-50 text-amber-600",
              purple: "bg-purple-50 text-purple-600",
            };
            return (
              <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    <p className="text-xs text-gray-400 mt-1">{stat.change}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[stat.color]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Alertas */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Alertas e Notificações</h2>
              <span className="text-xs text-gray-400">{alertas.length} itens</span>
            </div>
            <div className="divide-y divide-gray-50">
              {alertas.map((alerta, i) => {
                const iconMap = {
                  warning: { Icon: AlertTriangle, color: "text-amber-500" },
                  error: { Icon: AlertTriangle, color: "text-red-500" },
                  info: { Icon: Clock, color: "text-blue-500" },
                  success: { Icon: CheckCircle, color: "text-green-500" },
                };
                const { Icon, color } = iconMap[alerta.tipo as keyof typeof iconMap];
                return (
                  <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800">{alerta.mensagem}</p>
                      <p className="text-xs text-gray-400">{alerta.modulo}</p>
                    </div>
                    <button className="text-xs text-blue-600 hover:underline flex-shrink-0">
                      Ver
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Próximos Vencimentos */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Próximos Vencimentos</h2>
              <Receipt className="w-4 h-4 text-gray-400" />
            </div>
            <div className="divide-y divide-gray-50">
              {proximosVencimentos.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm text-gray-800">{item.descricao}</p>
                    <p className="text-xs text-gray-400">Vence em {item.data}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{item.valor}</p>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Competência Rápida */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Competência Atual — Junho/2026</h2>
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Proventos", value: "R$ 0,00" },
              { label: "Total Descontos", value: "R$ 0,00" },
              { label: "Total Líquido", value: "R$ 0,00" },
              { label: "Encargos Patronais", value: "R$ 0,00" },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className="text-lg font-bold text-gray-900 mt-1">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
