import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import { Info, Calculator } from "lucide-react";

const tabelaIRRF2026 = [
  { base: "Até R$ 2.259,20", aliquota: "Isento", deducao: "—" },
  { base: "De R$ 2.259,21 até R$ 2.826,65", aliquota: "7,5%", deducao: "R$ 169,44" },
  { base: "De R$ 2.826,66 até R$ 3.751,05", aliquota: "15%", deducao: "R$ 381,44" },
  { base: "De R$ 3.751,06 até R$ 4.664,68", aliquota: "22,5%", deducao: "R$ 662,77" },
  { base: "Acima de R$ 4.664,69", aliquota: "27,5%", deducao: "R$ 896,00" },
];

export default async function TabelaIRRFPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <>
      <Header title="Tabela IRRF 2026" subtitle="Lei nº 15.270/2025 — vigência a partir de janeiro/2026" />
      <div className="flex-1 p-6 space-y-6">

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Reforma Tributária 2026 — Lei nº 15.270/2025</p>
            <p className="mt-0.5 text-blue-700">
              A partir de janeiro/2026, trabalhadores com rendimento de até <strong>R$ 5.000,00</strong> estão isentos de IRRF,
              incluindo o redutor adicional proporcional para rendimentos até R$ 7.350,00.
              Dedução por dependente: <strong>R$ 189,59/mês</strong>.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Tabela Progressiva IRRF 2026</h2>
              <p className="text-xs text-gray-500 mt-0.5">Base: salário bruto − INSS − (dependentes × R$ 189,59)</p>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Base de Cálculo (mensal)</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">Alíquota</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">Parcela a Deduzir</th>
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
            <div className="px-5 py-3 bg-amber-50 border-t border-amber-100">
              <p className="text-xs text-amber-800">
                <strong>Redutor adicional:</strong> Para base entre R$ 5.000,01 e R$ 7.350,00, aplica-se redução proporcional
                do IR calculado, conforme art. 3º da Lei nº 15.270/2025.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-gray-900">Deduções Permitidas</h2>
            </div>
            <div className="space-y-3">
              {[
                { item: "Dependente", valor: "R$ 189,59/mês por dependente" },
                { item: "INSS retido", valor: "Valor total descontado na competência" },
                { item: "Pensão alimentícia judicial", valor: "Valor determinado judicialmente" },
                { item: "Contribuição previdenciária do servidor", valor: "Valor das contribuições" },
                { item: "Despesas com instrução (Declaração)", valor: "Até R$ 3.561,50/ano" },
                { item: "Despesas médicas (Declaração)", valor: "Sem limite" },
              ].map((d) => (
                <div key={d.item} className="flex items-start justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-700">{d.item}</span>
                  <span className="text-sm text-gray-600 text-right flex-shrink-0">{d.valor}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Fórmula do cálculo:</p>
              <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs text-gray-700 space-y-1">
                <p>Base = Salário Bruto − INSS − (Dependentes × 189,59)</p>
                <p>IR = Base × Alíquota − Parcela a deduzir</p>
                <p className="text-blue-600">Se Base ≤ 5.000,00 → IR = 0</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
