import Header from "@/components/layout/Header";
import { Play, Lock, Send, Download, Plus, ChevronDown, AlertCircle } from "lucide-react";

export default function FolhaPage() {
  const competencia = "2026-06";
  const label = "Junho/2026";

  return (
    <>
      <Header title="Folha de Pagamento" subtitle={`Competência: ${label}`} />
      <div className="flex-1 p-6 space-y-6">

        {/* Competência Selector + Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              {label}
              <ChevronDown className="w-4 h-4" />
            </button>
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Normal
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              <Download className="w-4 h-4" />
              Exportar
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600 transition-colors">
              <Lock className="w-4 h-4" />
              Fechar Folha
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors">
              <Play className="w-4 h-4" />
              Processar Folha
            </button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3">
          {[
            { label: "Funcionários", value: "0" },
            { label: "Total Proventos", value: "R$ 0,00" },
            { label: "Total Descontos", value: "R$ 0,00" },
            { label: "Total Líquido", value: "R$ 0,00" },
            { label: "INSS Empregado", value: "R$ 0,00" },
            { label: "INSS Patronal", value: "R$ 0,00" },
            { label: "FGTS", value: "R$ 0,00" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-lg border border-gray-200 px-3 py-3">
              <p className="text-[11px] text-gray-500">{s.label}</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Main Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-sm">Contracheques — {label}</h2>
            <button className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
              <Plus className="w-3 h-3" />
              Lançamento Manual
            </button>
          </div>

          {/* Empty state */}
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-700 mb-1">Nenhum funcionário na folha</h3>
            <p className="text-sm text-gray-500 max-w-sm">
              Selecione uma empresa e clique em "Processar Folha" para calcular automaticamente
              todos os proventos e descontos conforme a legislação vigente.
            </p>
            <button className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
              <Play className="w-4 h-4" />
              Processar Folha
            </button>
          </div>
        </div>

        {/* Info Panel */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3 text-sm">Lançamentos Manuais Permitidos</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              "Horas Extras", "Comissões", "Adicional Noturno",
              "Desconto de Falta", "Vale-Alimentação", "Adiantamento",
              "Pensão Alimentícia", "Outros Proventos", "Outros Descontos",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
