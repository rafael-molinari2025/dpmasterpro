"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import { Info, Calculator } from "lucide-react";
import { calcularINSS, calcularIRRF } from "@/lib/calculo-folha";

const tabelaIRRF2026 = [
  { base: "Até R$ 2.259,20", aliquota: "Isento", deducao: "—" },
  { base: "De R$ 2.259,21 até R$ 2.826,65", aliquota: "7,5%", deducao: "R$ 169,44" },
  { base: "De R$ 2.826,66 até R$ 3.751,05", aliquota: "15%", deducao: "R$ 381,44" },
  { base: "De R$ 3.751,06 até R$ 4.664,68", aliquota: "22,5%", deducao: "R$ 662,77" },
  { base: "Acima de R$ 4.664,69", aliquota: "27,5%", deducao: "R$ 896,00" },
];

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function TabelaIRRFPage() {
  const [salario, setSalario] = useState("");
  const [deps, setDeps] = useState("0");
  const [resultado, setResultado] = useState<{ inss: number; baseIRRF: number; irrf: number } | null>(null);

  function calcular() {
    const sal = parseFloat(salario.replace(",", ".")) || 0;
    const numDeps = parseInt(deps) || 0;
    if (sal <= 0) return;
    const inss = calcularINSS(sal);
    const baseIRRF = Math.max(0, sal - inss - numDeps * 189.59);
    const irrf = calcularIRRF(sal - inss, numDeps);
    setResultado({ inss, baseIRRF, irrf });
  }

  return (
    <>
      <Header title="Tabela IRRF 2026" subtitle="Lei nº 15.270/2025 — vigência a partir de janeiro/2026" />
      <div className="flex-1 p-3 sm:p-6 space-y-6">

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

          <div className="space-y-6">
            {/* Calculadora */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-600" />
                <h2 className="font-semibold text-gray-900">Calcular IRRF</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Salário Bruto (R$)</label>
                  <input
                    type="number"
                    value={salario}
                    onChange={(e) => setSalario(e.target.value)}
                    placeholder="Ex: 4500,00"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Dependentes</label>
                  <input
                    type="number"
                    value={deps}
                    onChange={(e) => setDeps(e.target.value)}
                    min="0"
                    max="20"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <button
                onClick={calcular}
                className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors font-medium"
              >
                Calcular
              </button>

              {resultado && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Salário Bruto:</span>
                    <span className="font-medium">R$ {fmt(parseFloat(salario.replace(",", ".")) || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">(-) INSS:</span>
                    <span className="font-medium text-red-600">R$ {fmt(resultado.inss)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">(-) Dependentes ({deps} × R$ 189,59):</span>
                    <span className="font-medium text-red-600">R$ {fmt((parseInt(deps) || 0) * 189.59)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                    <span className="text-gray-600">Base de Cálculo IRRF:</span>
                    <span className="font-medium">R$ {fmt(resultado.baseIRRF)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-gray-200 pt-2">
                    <span className={resultado.irrf === 0 ? "text-green-700" : "text-red-700"}>
                      {resultado.irrf === 0 ? "✓ Isento de IRRF" : "IRRF Retido:"}
                    </span>
                    <span className={resultado.irrf === 0 ? "text-green-700 text-lg" : "text-red-700 text-lg"}>
                      {resultado.irrf === 0 ? "R$ 0,00" : `R$ ${fmt(resultado.irrf)}`}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <h2 className="font-semibold text-gray-900">Deduções Permitidas</h2>
              <div className="space-y-2">
                {[
                  { item: "Dependente", valor: "R$ 189,59/mês por dependente" },
                  { item: "INSS retido", valor: "Valor total descontado na competência" },
                  { item: "Pensão alimentícia judicial", valor: "Valor determinado judicialmente" },
                  { item: "Despesas com instrução (Declaração)", valor: "Até R$ 3.561,50/ano" },
                  { item: "Despesas médicas (Declaração)", valor: "Sem limite" },
                ].map((d) => (
                  <div key={d.item} className="flex items-start justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
                    <span className="text-sm text-gray-700">{d.item}</span>
                    <span className="text-sm text-gray-600 text-right flex-shrink-0">{d.valor}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
