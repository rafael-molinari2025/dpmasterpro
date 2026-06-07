import Header from "@/components/layout/Header";
import { Plus, Search, Filter, MoreVertical, UserCheck, UserX } from "lucide-react";

const situacaoLabel: Record<string, { label: string; color: string }> = {
  ATIVO: { label: "Ativo", color: "bg-green-50 text-green-700" },
  FERIAS: { label: "Férias", color: "bg-blue-50 text-blue-700" },
  AFASTADO: { label: "Afastado", color: "bg-amber-50 text-amber-700" },
  DEMITIDO: { label: "Demitido", color: "bg-red-50 text-red-700" },
};

export default function FuncionariosPage() {
  const funcionarios = [
    {
      id: "1",
      matricula: "0001",
      nome: "João da Silva",
      cpf: "123.456.789-00",
      cargo: "Analista de TI",
      setor: "Tecnologia",
      dataAdmissao: "15/03/2022",
      salario: 5500.00,
      situacao: "ATIVO",
    },
    {
      id: "2",
      matricula: "0002",
      nome: "Maria Aparecida Santos",
      cpf: "987.654.321-00",
      cargo: "Assistente Administrativo",
      setor: "Administração",
      dataAdmissao: "01/08/2021",
      salario: 2800.00,
      situacao: "FERIAS",
    },
    {
      id: "3",
      matricula: "0003",
      nome: "Carlos Eduardo Oliveira",
      cpf: "456.789.123-00",
      cargo: "Vendedor",
      setor: "Comercial",
      dataAdmissao: "10/01/2023",
      salario: 1900.00,
      situacao: "ATIVO",
    },
  ];

  return (
    <>
      <Header title="Funcionários" subtitle="Cadastro e gestão de colaboradores" />
      <div className="flex-1 p-6">

        {/* Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar funcionário..."
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              Filtros
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Importar
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4" />
              Novo Funcionário
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Ativos", value: 2, color: "text-green-600" },
            { label: "Em Férias", value: 1, color: "text-blue-600" },
            { label: "Afastados", value: 0, color: "text-amber-600" },
            { label: "Total", value: 3, color: "text-gray-900" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-lg border border-gray-200 px-4 py-3 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Matrícula</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Funcionário</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Cargo / Setor</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Admissão</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Salário</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Situação</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {funcionarios.map((f) => {
                const sit = situacaoLabel[f.situacao];
                return (
                  <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-sm font-mono text-gray-500">{f.matricula}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold flex-shrink-0">
                          {f.nome.split(" ").map(n => n[0]).slice(0, 2).join("")}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{f.nome}</p>
                          <p className="text-xs text-gray-500">{f.cpf}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-800">{f.cargo}</p>
                      <p className="text-xs text-gray-500">{f.setor}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{f.dataAdmissao}</td>
                    <td className="px-5 py-4 text-sm text-right font-medium text-gray-900">
                      R$ {f.salario.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${sit.color}`}>
                        {sit.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">3 funcionários encontrados</p>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 disabled:opacity-40">Anterior</button>
              <button className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 disabled:opacity-40">Próxima</button>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
