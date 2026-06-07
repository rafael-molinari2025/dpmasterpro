import Header from "@/components/layout/Header";
import { RefreshCw, Info, Calculator } from "lucide-react";

const tabelaINSS2026 = [
  { faixa: "1ª Faixa", de: 0, ate: 1518.00, aliquota: 7.5, teto: 113.85 },
  { faixa: "2ª Faixa", de: 1518.01, ate: 2793.88, aliquota: 9.0, teto: 114.74 },
  { faixa: "3ª Faixa", de: 2793.89, ate: 4190.83, aliquota: 12.0, teto: 167.75 },
  { faixa: "4ª Faixa", de: 4190.84, ate: 8157.41, aliquota: 14.0, teto: 555.21 },
];

const tabelaIRRF2026 = [
  { base: "Até R$ 2.259,20", aliquota: "Isento", deducao: "-" },
  { base: "De R$ 2.259,21 até R$ 2.826,65", aliquota: "7,5%", deducao: "R$ 169,44" },
  { base: "De R$ 2.826,66 até R$ 3.751,05", aliquota: "15%", deducao: "R$ 381,44" },
  { base: "De R$ 3.751,06 até R$ 4.664,68", aliquota: "22,5%", deducao: "R$ 662,77" },
  { base: "Acima de R$ 4.664,69", aliquota: "27,5%", deducao: "R$ 896,00" },
];

export default function TabelaINSSPage() {
  return (
    <>
      <Header title="Tabelas Legais — INSS" subtitle="Portaria Interministerial MPS/MF nº 13/2026" />
      <div className="flex-1 p-6 space-y-6">

        {/* Info Banner 2026 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">Reforma Tributária 2026 — Lei nº 15.270/2025</p>
            <p className="text-sm text-blue-700 mt-0.5">
              A partir de janeiro/2026, trabalhadores com rendimento de até <strong>R$ 5.000,00</strong> estão isentos de IRRF.
              Há redução gradual até R$ 7.350,00. O salário mínimo foi reajustado para <strong>R$ 1.621,00</strong>.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* INSS 2026 */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">Tabela INSS 2026 — Progressiva</h2>
                <p className="text-xs text-gray-500 mt-0.5">Teto de contribuição: R$ 8.157,41 | Contribuição máxima: R$ 951,55</p>
              </div>
              <button className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                <RefreshCw className="w-3 h-3" />
                Atualizar
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Faixa</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">Salário Mín.</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">Salário Máx.</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">Alíquota</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">Teto Faixa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tabelaINSS2026.map((row) => (
                    <tr key={row.faixa} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-sm font-medium text-gray-700">{row.faixa}</td>
                      <td className="px-5 py-3 text-sm text-right text-gray-600">
                        R$ {row.de.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3 text-sm text-right text-gray-600">
                        R$ {row.ate.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-sm font-bold text-blue-700">{row.aliquota}%</span>
                      </td>
                      <td className="px-5 py-3 text-sm text-right font-medium text-gray-900">
                        R$ {row.teto.toFixed(2).replace(".", ",")}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-blue-50">
                  <tr>
                    <td colSpan={3} className="px-5 py-3 text-xs font-medium text-blue-800">Contribuição Máxima Total</td>
                    <td colSpan={2} className="px-5 py-3 text-sm font-bold text-right text-blue-900">R$ 951,55</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* IRRF 2026 */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">Tabela IRRF 2026</h2>
                <p className="text-xs text-gray-500 mt-0.5">Dedução por dependente: R$ 189,59 | Isento até R$ 5.000,00</p>
              </div>
              <button className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                <RefreshCw className="w-3 h-3" />
                Atualizar
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Base de Cálculo</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">Alíquota</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">Dedução</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tabelaIRRF2026.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-sm text-gray-700">{row.base}</td>
                      <td className="px-5 py-3 text-right">
                        <span className={`text-sm font-bold ${row.aliquota === "Isento" ? "text-green-600" : "text-orange-600"}`}>
                          {row.aliquota}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-right text-gray-600">{row.deducao}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 bg-amber-50 border-t border-amber-100">
              <p className="text-xs text-amber-800">
                <strong>Redutor adicional 2026:</strong> Para base entre R$ 5.000,01 e R$ 7.350,00, aplica-se
                redução proporcional do IR calculado conforme Lei nº 15.270/2025.
              </p>
            </div>
          </div>
        </div>

        {/* Simulador */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Simulador de Encargos</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Salário Bruto</label>
              <input
                type="number"
                placeholder="0,00"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Nº Dependentes IRRF</label>
              <input
                type="number"
                placeholder="0"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
                Calcular
              </button>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-1">
              <div className="flex justify-between"><span className="text-gray-500">INSS:</span> <span className="font-medium">R$ -</span></div>
              <div className="flex justify-between"><span className="text-gray-500">IRRF:</span> <span className="font-medium">R$ -</span></div>
              <div className="flex justify-between"><span className="text-gray-500">FGTS:</span> <span className="font-medium">R$ -</span></div>
              <div className="flex justify-between border-t pt-1"><span className="font-medium text-gray-700">Líquido:</span> <span className="font-bold text-green-700">R$ -</span></div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
