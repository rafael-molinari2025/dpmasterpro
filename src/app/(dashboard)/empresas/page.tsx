import Header from "@/components/layout/Header";
import { Building2, Plus, Search, Filter, MoreVertical, CheckCircle, XCircle } from "lucide-react";

export default function EmpresasPage() {
  const empresas = [
    {
      id: "1",
      razaoSocial: "Comércio e Serviços Exemplo Ltda",
      nomeFantasia: "Exemplo Store",
      cnpj: "12.345.678/0001-90",
      regime: "Lucro Presumido",
      funcionarios: 15,
      ativa: true,
    },
    {
      id: "2",
      razaoSocial: "Transportes Modelo S/A",
      nomeFantasia: "Transportes Modelo",
      cnpj: "98.765.432/0001-10",
      regime: "Lucro Real",
      funcionarios: 42,
      ativa: true,
    },
    {
      id: "3",
      razaoSocial: "Padaria Artesanal ME",
      nomeFantasia: "Pão Nosso",
      cnpj: "11.222.333/0001-44",
      regime: "Simples Nacional",
      funcionarios: 8,
      ativa: false,
    },
  ];

  return (
    <>
      <Header title="Empresas" subtitle="Gestão das empresas clientes do escritório" />
      <div className="flex-1 p-6">

        {/* Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar empresa..."
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              Filtros
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            Nova Empresa
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Empresa</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">CNPJ</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Regime</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Funcionários</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {empresas.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                        {e.razaoSocial[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{e.razaoSocial}</p>
                        <p className="text-xs text-gray-500">{e.nomeFantasia}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600 font-mono">{e.cnpj}</td>
                  <td className="px-5 py-4">
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                      {e.regime}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {e.funcionarios}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {e.ativa ? (
                      <span className="flex items-center gap-1 text-xs text-green-700">
                        <CheckCircle className="w-3 h-3" /> Ativa
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-red-600">
                        <XCircle className="w-3 h-3" /> Inativa
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">3 empresas encontradas</p>
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
