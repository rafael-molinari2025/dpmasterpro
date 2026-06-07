import Header from "@/components/layout/Header";
import { Plus, Search, Calendar, AlertTriangle, CheckCircle, Clock } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  A_VENCER: { label: "A Vencer", color: "bg-blue-50 text-blue-700", icon: Clock },
  VENCIDA: { label: "Vencida", color: "bg-red-50 text-red-700", icon: AlertTriangle },
  AGENDADA: { label: "Agendada", color: "bg-green-50 text-green-700", icon: Calendar },
  GOZADA: { label: "Gozada", color: "bg-gray-50 text-gray-600", icon: CheckCircle },
};

const ferias = [
  {
    id: "1",
    funcionario: "João da Silva",
    cargo: "Analista de TI",
    periodoAquisitivo: "15/03/2022 – 14/03/2023",
    vencimento: "14/09/2023",
    diasDireito: 30,
    diasGozados: null,
    status: "VENCIDA",
  },
  {
    id: "2",
    funcionario: "Maria Aparecida Santos",
    cargo: "Assistente Administrativo",
    periodoAquisitivo: "01/08/2022 – 31/07/2023",
    vencimento: "31/01/2024",
    diasDireito: 30,
    diasGozados: 30,
    status: "AGENDADA",
  },
  {
    id: "3",
    funcionario: "Carlos Eduardo Oliveira",
    cargo: "Vendedor",
    periodoAquisitivo: "10/01/2023 – 09/01/2024",
    vencimento: "09/07/2024",
    diasDireito: 30,
    diasGozados: null,
    status: "A_VENCER",
  },
];

export default function FeriasPage() {
  return (
    <>
      <Header title="Férias" subtitle="Controle de períodos aquisitivos e programação de gozo" />
      <div className="flex-1 p-6 space-y-6">

        {/* Alerts */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">1 funcionário com férias vencidas</p>
            <p className="text-sm text-red-700">
              João da Silva está com período vencido desde set/2023. Isso pode gerar passivo trabalhista e multas.
              Programe o gozo imediatamente.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "A Vencer (30d)", value: 1, color: "text-blue-600" },
            { label: "Vencidas", value: 1, color: "text-red-600" },
            { label: "Agendadas", value: 1, color: "text-green-600" },
            { label: "Gozadas no Mês", value: 0, color: "text-gray-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-lg border border-gray-200 px-4 py-3 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar funcionário..."
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            Programar Férias
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Funcionário</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Período Aquisitivo</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Vencimento</th>
                <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Dias</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ferias.map((f) => {
                const s = statusConfig[f.status];
                const StatusIcon = s.icon;
                return (
                  <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-gray-900">{f.funcionario}</p>
                      <p className="text-xs text-gray-500">{f.cargo}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{f.periodoAquisitivo}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">{f.vencimento}</td>
                    <td className="px-5 py-4 text-center">
                      <div className="text-sm font-medium text-gray-900">
                        {f.diasGozados !== null ? `${f.diasGozados}/${f.diasDireito}d` : `${f.diasDireito}d`}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full w-fit ${s.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {s.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button className="text-xs text-blue-600 hover:underline">Calcular</button>
                        <button className="text-xs text-gray-500 hover:underline">Programar</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* CLT Info */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-2">Regras CLT — Férias (Arts. 129–145)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
            <div>
              <p className="font-medium text-slate-700">Direito</p>
              <p>30 dias após 12 meses de trabalho. Reduções por faltas (art. 130).</p>
            </div>
            <div>
              <p className="font-medium text-slate-700">Abono Pecuniário</p>
              <p>Até 1/3 dos dias (máx. 10 dias), requerido até 15 dias antes.</p>
            </div>
            <div>
              <p className="font-medium text-slate-700">Pagamento</p>
              <p>2 dias úteis antes do início. 1/3 constitucional obrigatório.</p>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
