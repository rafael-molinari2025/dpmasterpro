import Header from "@/components/layout/Header";
import { Download, QrCode, Copy, CheckCircle, Clock, AlertTriangle, Printer } from "lucide-react";

const tipoGuiaInfo: Record<string, { label: string; cor: string; vencimento: string; descricao: string }> = {
  GPS_INSS: {
    label: "GPS — INSS",
    cor: "bg-blue-50 text-blue-700 border-blue-200",
    vencimento: "Dia 20 do mês seguinte",
    descricao: "Guia de Previdência Social — INSS Empregado + Patronal",
  },
  DARF_IRRF: {
    label: "DARF — IRRF",
    cor: "bg-orange-50 text-orange-700 border-orange-200",
    vencimento: "Dia 20 do mês seguinte",
    descricao: "Documento de Arrecadação de Receitas Federais — Imposto de Renda",
  },
  FGTS_DIGITAL: {
    label: "FGTS Digital",
    cor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    vencimento: "Dia 7 do mês seguinte",
    descricao: "Fundo de Garantia por Tempo de Serviço — Exclusivo PIX",
  },
  DCTFWEB: {
    label: "DCTFWeb",
    cor: "bg-purple-50 text-purple-700 border-purple-200",
    vencimento: "Dia 15 do mês seguinte",
    descricao: "Declaração de Débitos e Créditos Tributários Federais Web",
  },
};

const guias = [
  {
    id: "1",
    tipo: "GPS_INSS",
    empresa: "Comércio e Serviços Exemplo Ltda",
    competencia: "2026-05",
    vencimento: "20/06/2026",
    valor: 1_847.50,
    status: "PENDENTE",
  },
  {
    id: "2",
    tipo: "DARF_IRRF",
    empresa: "Comércio e Serviços Exemplo Ltda",
    competencia: "2026-05",
    vencimento: "20/06/2026",
    valor: 432.10,
    status: "PENDENTE",
  },
  {
    id: "3",
    tipo: "FGTS_DIGITAL",
    empresa: "Comércio e Serviços Exemplo Ltda",
    competencia: "2026-05",
    vencimento: "07/07/2026",
    valor: 3_210.00,
    status: "PENDENTE",
  },
  {
    id: "4",
    tipo: "GPS_INSS",
    empresa: "Transportes Modelo S/A",
    competencia: "2026-04",
    vencimento: "20/05/2026",
    valor: 6_543.20,
    status: "PAGO",
  },
];

export default function GuiasPage() {
  return (
    <>
      <Header title="Guias de Pagamento" subtitle="GPS, DARF, FGTS Digital e DCTFWeb" />
      <div className="flex-1 p-6 space-y-6">

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(tipoGuiaInfo).map(([tipo, info]) => (
            <div key={tipo} className={`border rounded-xl p-4 ${info.cor}`}>
              <p className="text-xs font-semibold">{info.label}</p>
              <p className="text-[11px] mt-1 opacity-80">{info.vencimento}</p>
              <p className="text-lg font-bold mt-2">R$ 0,00</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-600">
              <option>Todas as guias</option>
              <option>GPS — INSS</option>
              <option>DARF — IRRF</option>
              <option>FGTS Digital</option>
              <option>DCTFWeb</option>
            </select>
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-600">
              <option>Todos os status</option>
              <option>Pendente</option>
              <option>Pago</option>
              <option>Vencida</option>
            </select>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4" />
            Gerar Guias do Mês
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
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
                const info = tipoGuiaInfo[g.tipo];
                return (
                  <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full border ${info.cor}`}>
                        {info.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700 max-w-[200px]">
                      <span className="truncate block">{g.empresa}</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {g.competencia.split("-").reverse().join("/")}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{g.vencimento}</td>
                    <td className="px-5 py-4 text-sm font-bold text-right text-gray-900">
                      R$ {g.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4">
                      {g.status === "PAGO" ? (
                        <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full w-fit">
                          <CheckCircle className="w-3 h-3" /> Pago
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-full w-fit">
                          <Clock className="w-3 h-3" /> Pendente
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        {g.tipo === "FGTS_DIGITAL" && (
                          <button title="PIX Copia e Cola" className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-emerald-600 hover:bg-emerald-50">
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button title="Copiar linha digitável" className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button title="Imprimir / PDF" className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">{guias.length} guias encontradas</p>
            <p className="text-xs text-amber-700 font-medium">
              3 pendentes • Total: R$ 5.489,60
            </p>
          </div>
        </div>

        {/* FGTS Info */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-sm font-medium text-emerald-800 mb-1">FGTS Digital 2026 — Exclusivo PIX</p>
          <p className="text-xs text-emerald-700">
            A partir de 2026, o pagamento do FGTS Digital é realizado exclusivamente via PIX instantâneo.
            O sistema gera automaticamente o código PIX Copia e Cola após o fechamento da folha e envio do eSocial.
          </p>
        </div>

      </div>
    </>
  );
}
