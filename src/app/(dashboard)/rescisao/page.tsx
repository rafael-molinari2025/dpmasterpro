import Header from "@/components/layout/Header";
import { Plus, Calculator, FileText, Search } from "lucide-react";

const tipoRescisaoLabel: Record<string, string> = {
  PEDIDO_DEMISSAO: "Pedido de Demissão",
  DEMISSAO_SEM_JUSTA_CAUSA: "Demissão Sem Justa Causa",
  DEMISSAO_COM_JUSTA_CAUSA: "Demissão Com Justa Causa",
  RESCISAO_INDIRETA: "Rescisão Indireta",
  ACORDO_MUTUAL: "Acordo Mutual",
  APOSENTADORIA: "Aposentadoria",
  TERMINO_CONTRATO: "Término de Contrato",
};

export default function RescisaoPage() {
  return (
    <>
      <Header title="Rescisão" subtitle="Cálculo e emissão de TRCT — Termo de Rescisão do Contrato de Trabalho" />
      <div className="flex-1 p-6 space-y-6">

        {/* Quick Action */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Calcular Nova Rescisão</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Funcionário</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar funcionário..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Tipo de Rescisão</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700">
                <option value="">Selecione...</option>
                {Object.entries(tipoRescisaoLabel).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Data do Desligamento</label>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
              <Calculator className="w-4 h-4" />
              Calcular Rescisão
            </button>
          </div>
        </div>

        {/* TRCT Preview */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">TRCT — Demonstrativo de Rescisão</h2>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 text-xs text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50">
                <FileText className="w-3.5 h-3.5" />
                Gerar PDF
              </button>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Proventos */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Verbas Rescisórias — Proventos</h3>
                <div className="space-y-2">
                  {[
                    { label: "Saldo de Salário", valor: "R$ 0,00" },
                    { label: "Aviso Prévio Indenizado", valor: "R$ 0,00" },
                    { label: "Férias Vencidas + 1/3", valor: "R$ 0,00" },
                    { label: "Férias Proporcionais + 1/3", valor: "R$ 0,00" },
                    { label: "13º Proporcional", valor: "R$ 0,00" },
                    { label: "Multa FGTS (40%)", valor: "R$ 0,00" },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.label}</span>
                      <span className="font-medium text-gray-900">{item.valor}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between text-sm font-bold">
                    <span className="text-gray-900">Total Bruto</span>
                    <span className="text-green-700">R$ 0,00</span>
                  </div>
                </div>
              </div>

              {/* Descontos + Totais */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Descontos</h3>
                <div className="space-y-2">
                  {[
                    { label: "INSS s/ Rescisão", valor: "R$ 0,00" },
                    { label: "IRRF s/ Rescisão", valor: "R$ 0,00" },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.label}</span>
                      <span className="font-medium text-red-600">- {item.valor}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between text-sm font-bold">
                    <span className="text-gray-900">Total Descontos</span>
                    <span className="text-red-600">R$ 0,00</span>
                  </div>
                </div>

                <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-xs text-green-700">Valor Líquido a Receber</p>
                  <p className="text-2xl font-bold text-green-800 mt-1">R$ 0,00</p>
                </div>

                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-700">FGTS a Depositar (+ multa)</p>
                  <p className="text-lg font-bold text-amber-800 mt-0.5">R$ 0,00</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CLT Reference */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-2">Referências CLT</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-slate-600">
            {[
              { tipo: "Pedido de Demissão", verbas: "Saldo + Férias + 13º Prop." },
              { tipo: "Sem Justa Causa", verbas: "+ Aviso + Multa FGTS 40%" },
              { tipo: "Com Justa Causa", verbas: "Apenas Saldo + FGTS" },
              { tipo: "Acordo Mutual", verbas: "+ 50% Aviso + Multa FGTS 20%" },
            ].map((item) => (
              <div key={item.tipo} className="bg-white border border-slate-200 rounded-lg p-3">
                <p className="font-medium text-slate-700">{item.tipo}</p>
                <p className="mt-1">{item.verbas}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
