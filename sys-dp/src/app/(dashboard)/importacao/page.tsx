import Header from "@/components/layout/Header";
import { Upload, FileSpreadsheet, FileCode, FileText, CheckCircle, AlertTriangle } from "lucide-react";

const formatos = [
  {
    titulo: "Excel / CSV",
    icon: FileSpreadsheet,
    desc: "Importe funcionários, rubricas ou lançamentos via planilha Excel ou CSV.",
    extensoes: [".xlsx", ".xls", ".csv"],
    modelos: ["Funcionários", "Lançamentos Manuais", "Cargos e Setores"],
    color: "green",
  },
  {
    titulo: "XML eSocial",
    icon: FileCode,
    desc: "Importe eventos eSocial de outros sistemas para migração ou retificação.",
    extensoes: [".xml"],
    modelos: ["S-2200 Admissão", "S-1200 Remuneração", "S-1010 Rubricas"],
    color: "blue",
  },
  {
    titulo: "SEFIP / GFIP",
    icon: FileText,
    desc: "Importe dados históricos do SEFIP para continuidade do FGTS digital.",
    extensoes: [".re", ".sefip"],
    modelos: ["Histórico FGTS"],
    color: "amber",
  },
];

const colorMap: Record<string, string> = {
  green: "bg-green-50 text-green-700 border-green-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
};

const btnMap: Record<string, string> = {
  green: "bg-green-600 hover:bg-green-700",
  blue: "bg-blue-600 hover:bg-blue-700",
  amber: "bg-amber-600 hover:bg-amber-700",
};

const historico = [
  { arquivo: "funcionarios_jan26.xlsx", tipo: "Excel", registros: 45, status: "sucesso", data: "06/01/2026" },
  { arquivo: "lancamentos_mai26.csv", tipo: "CSV", registros: 120, status: "sucesso", data: "01/06/2026" },
  { arquivo: "s2200_admissoes.xml", tipo: "XML eSocial", registros: 3, status: "aviso", data: "15/05/2026" },
];

export default function ImportacaoPage() {
  return (
    <>
      <Header title="Importação de Dados" subtitle="Migre dados de outros sistemas ou planilhas" />
      <div className="flex-1 p-3 sm:p-6 space-y-6">

        {/* Format Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {formatos.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.titulo} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium mb-3 ${colorMap[f.color]}`}>
                  <Icon className="w-4 h-4" />
                  {f.titulo}
                </div>
                <p className="text-sm text-gray-600 mb-3">{f.desc}</p>
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">Modelos disponíveis:</p>
                  <ul className="space-y-0.5">
                    {f.modelos.map((m) => (
                      <li key={m} className="text-xs text-gray-600 flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-gray-400" />
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex items-center gap-2">
                  <button className={`flex-1 text-white text-xs py-2 rounded-lg transition-colors ${btnMap[f.color]}`}>
                    <Upload className="w-3.5 h-3.5 inline mr-1" />
                    Importar
                  </button>
                  <button className="flex-1 text-xs text-gray-600 border border-gray-200 py-2 rounded-lg hover:bg-gray-50">
                    Baixar Modelo
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Drop Zone */}
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-10 flex flex-col items-center justify-center text-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer">
          <Upload className="w-10 h-10 text-gray-400 mb-3" />
          <p className="text-sm font-medium text-gray-700">Arraste e solte seu arquivo aqui</p>
          <p className="text-xs text-gray-500 mt-1">Suporta: .xlsx, .csv, .xml, .re, .sefip</p>
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
            Selecionar Arquivo
          </button>
        </div>

        {/* Import History */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Histórico de Importações</h2>
          </div>
          {/* Cards (mobile) */}
          <div className="sm:hidden divide-y divide-gray-100">
            {historico.map((h, i) => (
              <div key={i} className="p-4 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 truncate">{h.arquivo}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{h.tipo} · {h.registros} registros · {h.data}</p>
                </div>
                {h.status === "sucesso" ? (
                  <span className="flex-shrink-0 flex items-center gap-1 text-xs text-green-700">
                    <CheckCircle className="w-3.5 h-3.5" /> Sucesso
                  </span>
                ) : (
                  <span className="flex-shrink-0 flex items-center gap-1 text-xs text-amber-700">
                    <AlertTriangle className="w-3.5 h-3.5" /> Avisos
                  </span>
                )}
              </div>
            ))}
          </div>
          {/* Tabela (tablet/desktop) */}
          <div className="hidden sm:block overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Arquivo</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Tipo</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Registros</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {historico.map((h, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm text-gray-800">{h.arquivo}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{h.tipo}</td>
                  <td className="px-5 py-3 text-sm text-right text-gray-600">{h.registros}</td>
                  <td className="px-5 py-3">
                    {h.status === "sucesso" ? (
                      <span className="flex items-center gap-1 text-xs text-green-700">
                        <CheckCircle className="w-3 h-3" /> Sucesso
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-amber-700">
                        <AlertTriangle className="w-3 h-3" /> Com Avisos
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500">{h.data}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

      </div>
    </>
  );
}
