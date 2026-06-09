"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import { Info, Calculator } from "lucide-react";
import { calcularINSS, calcularIRRF, calcularFGTS } from "@/lib/calculo-folha";

const tabelaINSS2026 = [
  { faixa: "1ª Faixa", de: 0,       ate: 1518.00,  aliquota: 7.5,  teto: 113.85 },
  { faixa: "2ª Faixa", de: 1518.01, ate: 2793.88,  aliquota: 9.0,  teto: 114.74 },
  { faixa: "3ª Faixa", de: 2793.89, ate: 4190.83,  aliquota: 12.0, teto: 167.75 },
  { faixa: "4ª Faixa", de: 4190.84, ate: 8157.41,  aliquota: 14.0, teto: 555.21 },
];

const tabelaIRRF2026 = [
  { base: "Até R$ 5.000,00 (isenção 2026)",           aliquota: "Isento", deducao: "—" },
  { base: "De R$ 2.259,21 até R$ 2.826,65",           aliquota: "7,5%",   deducao: "R$ 169,44" },
  { base: "De R$ 2.826,66 até R$ 3.751,05",           aliquota: "15%",    deducao: "R$ 381,44" },
  { base: "De R$ 3.751,06 até R$ 4.664,68",           aliquota: "22,5%",  deducao: "R$ 662,77" },
  { base: "Acima de R$ 4.664,69",                     aliquota: "27,5%",  deducao: "R$ 896,00" },
];

interface Resultado {
  inss: number;
  irrf: number;
  fgts: number;
  liquido: number;
}

export default function TabelaINSSPage() {
  const [salario, setSalario] = useState("");
  const [deps, setDeps] = useState("0");
  const [resultado, setResultado] = useState<Resultado | null>(null);

  function calcular() {
    const s = parseFloat(salario.replace(",", "."));
    const d = parseInt(deps) || 0;
    if (!s || s <= 0) return;
    const inss = calcularINSS(s);
    const baseIRRF = Math.max(0, s - inss);
    const irrf = calcularIRRF(baseIRRF, d);
    const fgts = calcularFGTS(s);
    const liquido = s - inss - irrf;
    setResultado({ inss, irrf, fgts, liquido });
  }

  function fmt(v: number) {
    return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return (
    <>
      <Header title="Tabelas Legais — INSS" subtitle="Portaria Interministerial MPS/MF nº 13/2026" />
      <div className="flex-1 p-3 sm:p-6 space-y-6">

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">Reforma Tributária 2026 — Lei nº 15.270/2025</p>
            <p className="text-sm text-blue-700 mt-0.5">
              A partir de janeiro/2026, trabalhadores com rendimento de até <strong>R$ 5.000,00</strong> estão isentos de IRRF.
              O salário mínimo foi reajustado para <strong>R$ 1.621,00</strong>.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* INSS 2026 */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Tabela INSS 2026 — Progressiva</h2>
              <p className="text-xs text-gray-500 mt-0.5">Teto de contribuição: R$ 8.157,41 | Contribuição máxima: R$ 951,55</p>
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
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Tabela IRRF 2026</h2>
              <p className="text-xs text-gray-500 mt-0.5">Dedução por dependente: R$ 189,59 | Isento até R$ 5.000,00</p>
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
                <strong>Isenção 2026:</strong> Trabalhadores com rendimento tributável até R$ 5.000,00 estão isentos de IRRF conforme Lei nº 15.270/2025.
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
              <label className="text-xs text-gray-500 block mb-1">Salário Bruto (R$)</label>
              <input
                type="number"
                value={salario}
                onChange={(e) => setSalario(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && calcular()}
                placeholder="0,00"
                min="0"
                step="0.01"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Nº Dependentes IRRF</label>
              <input
                type="number"
                value={deps}
                onChange={(e) => setDeps(e.target.value)}
                placeholder="0"
                min="0"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={calcular}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors font-medium"
              >
                Calcular
              </button>
            </div>
            <div className={`rounded-lg p-3 text-xs space-y-1.5 ${resultado ? "bg-blue-50 border border-blue-100" : "bg-gray-50"}`}>
              <div className="flex justify-between">
                <span className="text-gray-500">INSS Empregado:</span>
                <span className="font-medium text-gray-800">
                  {resultado ? `R$ ${fmt(resultado.inss)}` : "R$ —"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">IRRF:</span>
                <span className="font-medium text-gray-800">
                  {resultado ? `R$ ${fmt(resultado.irrf)}` : "R$ —"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">FGTS (emp.):</span>
                <span className="font-medium text-gray-800">
                  {resultado ? `R$ ${fmt(resultado.fgts)}` : "R$ —"}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-1.5 mt-1">
                <span className="font-medium text-gray-700">Salário Líquido:</span>
                <span className={`font-bold ${resultado ? "text-green-700" : "text-gray-400"}`}>
                  {resultado ? `R$ ${fmt(resultado.liquido)}` : "R$ —"}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
