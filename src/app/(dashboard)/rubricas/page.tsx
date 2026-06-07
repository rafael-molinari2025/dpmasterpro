import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import { Plus, CheckCircle, XCircle, BookOpen } from "lucide-react";

const tipoColor: Record<string, string> = {
  PROVENTO: "bg-green-50 text-green-700",
  DESCONTO: "bg-red-50 text-red-700",
  INFORMATIVO: "bg-slate-50 text-slate-700",
  BASE_CALCULO: "bg-blue-50 text-blue-700",
};

function Tick({ val }: { val: boolean }) {
  return val
    ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
    : <XCircle className="w-4 h-4 text-gray-300 mx-auto" />;
}

export default async function RubricasPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; q?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const escritorioId = (session.user as any).escritorioId as string;
  const { tipo, q } = await searchParams;

  const rubricas = await db.rubrica.findMany({
    where: {
      OR: [{ global: true }, { empresa: { escritorioId } }],
      ...(tipo && { tipo: tipo as any }),
      ...(q && {
        OR: [
          { descricao: { contains: q, mode: "insensitive" } },
          { codigo: { contains: q } },
        ],
      }),
    },
    orderBy: [{ tipo: "asc" }, { codigo: "asc" }],
  });

  return (
    <>
      <Header title="Rubricas" subtitle="Configuração de eventos de folha e vinculação com o eSocial" />
      <div className="flex-1 p-6 space-y-6">

        <form method="GET" className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <input
              type="text"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Buscar rubrica..."
              className="pl-4 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
            <select
              name="tipo"
              defaultValue={tipo ?? ""}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os tipos</option>
              <option value="PROVENTO">Proventos</option>
              <option value="DESCONTO">Descontos</option>
              <option value="INFORMATIVO">Informativos</option>
              <option value="BASE_CALCULO">Base de Cálculo</option>
            </select>
            <button type="submit" className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Filtrar
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            Nova Rubrica
          </button>
        </form>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {rubricas.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Nenhuma rubrica encontrada</p>
            </div>
          ) : (
            <>
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rubricas.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-mono font-medium text-gray-700">{r.codigo}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{r.descricao}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${tipoColor[r.tipo] ?? "bg-gray-100 text-gray-600"}`}>
                            {r.tipo.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">{r.naturezaESocial ?? "—"}</td>
                        <td className="px-3 py-3 text-center"><Tick val={r.incideINSS} /></td>
                        <td className="px-3 py-3 text-center"><Tick val={r.incideFGTS} /></td>
                        <td className="px-3 py-3 text-center"><Tick val={r.incideIRRF} /></td>
                        <td className="px-3 py-3 text-center"><Tick val={r.incide13} /></td>
                        <td className="px-3 py-3 text-center"><Tick val={r.incideFerias} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-500">{rubricas.length} rubricas configuradas</p>
                <p className="text-xs text-gray-400">Vinculadas à Tabela 03 do eSocial S-1.3</p>
              </div>
            </>
          )}
        </div>

      </div>
    </>
  );
}
