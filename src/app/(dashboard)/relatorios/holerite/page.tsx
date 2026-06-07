import Header from "@/components/layout/Header";
import { Printer, Download, Send, Search, ChevronDown } from "lucide-react";

export default function HoleritePage() {
  return (
    <>
      <Header title="Holerite / Contracheque" subtitle="Emissão e envio de holerites por email" />
      <div className="flex-1 p-6 space-y-6">

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Competência</label>
            <button className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white hover:bg-gray-50">
              Junho/2026
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Tipo de Folha</label>
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700">
              <option>Normal</option>
              <option>Férias</option>
              <option>13º Salário</option>
              <option>Rescisão</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500 block mb-1">Funcionário</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Todos os funcionários"
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              <Printer className="w-4 h-4" />
              Imprimir Todos
            </button>
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              <Download className="w-4 h-4" />
              PDF em Lote
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
              <Send className="w-4 h-4" />
              Enviar por Email
            </button>
          </div>
        </div>

        {/* Holerite Preview (template) */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden max-w-2xl mx-auto">
          <div className="bg-slate-900 text-white px-6 py-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-lg font-bold">Comércio e Serviços Exemplo Ltda</p>
                <p className="text-slate-400 text-xs mt-0.5">CNPJ: 12.345.678/0001-90</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">CONTRACHEQUE</p>
                <p className="text-slate-400 text-xs">Competência: Junho/2026</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-b border-gray-100 grid grid-cols-3 gap-4 text-xs">
            <div>
              <p className="text-gray-500">Funcionário</p>
              <p className="font-medium text-gray-900 mt-0.5">João da Silva</p>
            </div>
            <div>
              <p className="text-gray-500">Matrícula / CPF</p>
              <p className="font-medium text-gray-900 mt-0.5">0001 / 123.456.789-00</p>
            </div>
            <div>
              <p className="text-gray-500">Cargo / Setor</p>
              <p className="font-medium text-gray-900 mt-0.5">Analista de TI / TI</p>
            </div>
            <div>
              <p className="text-gray-500">Admissão</p>
              <p className="font-medium text-gray-900 mt-0.5">15/03/2022</p>
            </div>
            <div>
              <p className="text-gray-500">Salário Base</p>
              <p className="font-medium text-gray-900 mt-0.5">R$ 5.500,00</p>
            </div>
            <div>
              <p className="text-gray-500">PIS/NIT</p>
              <p className="font-medium text-gray-900 mt-0.5">000.00000.00-0</p>
            </div>
          </div>

          <div className="px-6 py-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-gray-500 font-medium">Cód.</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Descrição</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Ref.</th>
                  <th className="text-right py-2 text-green-600 font-medium">Proventos</th>
                  <th className="text-right py-2 text-red-600 font-medium">Descontos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  { cod: "0001", desc: "Salário Base", ref: "220h", provento: "5.500,00", desconto: "" },
                  { cod: "0100", desc: "INSS — Empregado", ref: "", provento: "", desconto: "545,96" },
                  { cod: "0101", desc: "IRRF", ref: "", provento: "", desconto: "0,00" },
                  { cod: "0200", desc: "Vale-Transporte", ref: "6%", provento: "", desconto: "174,00" },
                ].map((row) => (
                  <tr key={row.cod}>
                    <td className="py-2 font-mono text-gray-500">{row.cod}</td>
                    <td className="py-2 text-gray-700">{row.desc}</td>
                    <td className="py-2 text-right text-gray-500">{row.ref}</td>
                    <td className="py-2 text-right text-green-700 font-medium">{row.provento}</td>
                    <td className="py-2 text-right text-red-600 font-medium">{row.desconto}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-gray-300">
                <tr>
                  <td colSpan={3} className="pt-3 text-gray-500">Totais</td>
                  <td className="pt-3 text-right font-bold text-green-700">R$ 5.500,00</td>
                  <td className="pt-3 text-right font-bold text-red-600">R$ 719,96</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="bg-slate-900 px-6 py-3 flex justify-between text-xs text-white">
            <div>
              <span className="text-slate-400">Salário Líquido: </span>
              <span className="font-bold text-lg">R$ 4.780,04</span>
            </div>
            <div className="text-right text-slate-400">
              <p>FGTS do Mês: R$ 440,00</p>
              <p>Base IRRF: R$ 4.954,04</p>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
