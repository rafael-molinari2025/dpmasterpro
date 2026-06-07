import Header from "@/components/layout/Header";
import { Plus, Search, Edit2, Copy, Trash2, CheckCircle, XCircle } from "lucide-react";

const tipoColor: Record<string, string> = {
  PROVENTO: "bg-green-50 text-green-700",
  DESCONTO: "bg-red-50 text-red-700",
  INFORMATIVO: "bg-slate-50 text-slate-700",
  BASE_CALCULO: "bg-blue-50 text-blue-700",
};

const rubricas = [
  {
    id: "1", codigo: "0001", descricao: "Salário Base", tipo: "PROVENTO",
    naturezaESocial: "1000 — Remuneração básica",
    incideINSS: true, incideFGTS: true, incideIRRF: true,
    incide13: true, incideFerias: true, ativa: true,
  },
  {
    id: "2", codigo: "0010", descricao: "Hora Extra 50%", tipo: "PROVENTO",
    naturezaESocial: "1011 — Hora extra até 50%",
    incideINSS: true, incideFGTS: true, incideIRRF: true,
    incide13: true, incideFerias: true, ativa: true,
  },
  {
    id: "3", codigo: "0020", descricao: "Adicional Noturno", tipo: "PROVENTO",
    naturezaESocial: "1010 — Adicionais legais",
    incideINSS: true, incideFGTS: true, incideIRRF: true,
    incide13: true, incideFerias: true, ativa: true,
  },
  {
    id: "4", codigo: "0100", descricao: "INSS — Empregado", tipo: "DESCONTO",
    naturezaESocial: "3000 — Desconto INSS",
    incideINSS: false, incideFGTS: false, incideIRRF: false,
    incide13: false, incideFerias: false, ativa: true,
  },
  {
    id: "5", codigo: "0101", descricao: "IRRF", tipo: "DESCONTO",
    naturezaESocial: "3500 — Desconto IRRF",
    incideINSS: false, incideFGTS: false, incideIRRF: false,
    incide13: false, incideFerias: false, ativa: true,
  },
  {
    id: "6", codigo: "0200", descricao: "Vale-Transporte", tipo: "DESCONTO",
    naturezaESocial: "4000 — Desconto vale-transporte",
    incideINSS: false, incideFGTS: false, incideIRRF: false,
    incide13: false, incideFerias: false, ativa: true,
  },
  {
    id: "7", codigo: "0300", descricao: "FGTS — Base Informativa", tipo: "INFORMATIVO",
    naturezaESocial: "9001 — FGTS depositado",
    incideINSS: false, incideFGTS: false, incideIRRF: false,
    incide13: false, incideFerias: false, ativa: true,
  },
];

function Tick({ val }: { val: boolean }) {
  return val
    ? <CheckCircle className="w-4 h-4 text-green-500" />
    : <XCircle className="w-4 h-4 text-gray-300" />;
}

export default function RubricasPage() {
  return (
    <>
      <Header title="Rubricas" subtitle="Configuração de eventos de folha e vinculação com o eSocial" />
      <div className="flex-1 p-6 space-y-6">

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar rubrica..."
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Todos os tipos</option>
              <option value="PROVENTO">Proventos</option>
              <option value="DESCONTO">Descontos</option>
              <option value="INFORMATIVO">Informativos</option>
              <option value="BASE_CALCULO">Base de Cálculo</option>
            </select>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            Nova Rubrica
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Código</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Descrição</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Natureza eSocial</th>
                  <th className="text-center px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">INSS</th>
                  <th className="text-center px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">FGTS</th>
                  <th className="text-center px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">IRRF</th>
                  <th className="text-center px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">13º</th>
                  <th className="text-center px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Férias</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rubricas.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono font-medium text-gray-700">{r.codigo}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{r.descricao}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${tipoColor[r.tipo]}`}>
                        {r.tipo.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{r.naturezaESocial}</td>
                    <td className="px-3 py-3 text-center"><Tick val={r.incideINSS} /></td>
                    <td className="px-3 py-3 text-center"><Tick val={r.incideFGTS} /></td>
                    <td className="px-3 py-3 text-center"><Tick val={r.incideIRRF} /></td>
                    <td className="px-3 py-3 text-center"><Tick val={r.incide13} /></td>
                    <td className="px-3 py-3 text-center"><Tick val={r.incideFerias} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">{rubricas.length} rubricas configuradas</p>
            <p className="text-xs text-gray-400">Todas vinculadas à Tabela 03 do eSocial S-1.3</p>
          </div>
        </div>

      </div>
    </>
  );
}
