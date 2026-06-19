import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import Link from "next/link";
import { Plus, Search, Calendar, AlertTriangle, CheckCircle, Clock } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  A_VENCER:  { label: "A Vencer",  color: "bg-blue-50 text-blue-700",   icon: Clock },
  VENCIDA:   { label: "Vencida",   color: "bg-red-50 text-red-700",     icon: AlertTriangle },
  AGENDADA:  { label: "Agendada",  color: "bg-green-50 text-green-700", icon: Calendar },
  GOZADA:    { label: "Gozada",    color: "bg-gray-50 text-gray-600",   icon: CheckCircle },
  CANCELADA: { label: "Cancelada", color: "bg-slate-50 text-slate-500", icon: CheckCircle },
};

function fmtDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString("pt-BR");
}

export default async function FeriasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; empresaId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const escritorioId = (session.user as any).escritorioId as string;

  const { q, status, empresaId } = await searchParams;

  const [ferias, empresas] = await Promise.all([
    db.ferias.findMany({
      where: {
        empresa: { escritorioId },
        ...(empresaId && { empresaId }),
        ...(status && { status: status as any }),
        ...(q && {
          funcionario: { nome: { contains: q, mode: "insensitive" } },
        }),
      },
      include: {
        funcionario: {
          select: {
            nome: true,
            cargo: { select: { descricao: true } },
          },
        },
      },
      orderBy: { dataFimAquisitivo: "asc" },
    }),
    db.empresa.findMany({
      where: { escritorioId, ativa: true },
      select: { id: true, nomeFantasia: true, razaoSocial: true },
      orderBy: { razaoSocial: "asc" },
    }),
  ]);

  const countAVencer = ferias.filter((f) => f.status === "A_VENCER").length;
  const countVencida = ferias.filter((f) => f.status === "VENCIDA").length;
  const countAgendada = ferias.filter((f) => f.status === "AGENDADA").length;
  const hoje = new Date();
  const countGozadaMes = ferias.filter(
    (f) =>
      f.status === "GOZADA" &&
      f.dataFimGozo &&
      f.dataFimGozo >= new Date(hoje.getFullYear(), hoje.getMonth(), 1),
  ).length;

  return (
    <>
      <Header title="Férias" subtitle="Controle de períodos aquisitivos e programação de gozo" />
      <div className="flex-1 p-3 sm:p-6 space-y-6">

        {countVencida > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">
                {countVencida} funcionário{countVencida !== 1 ? "s" : ""} com férias vencidas
              </p>
              <p className="text-sm text-red-700">
                Períodos vencidos geram passivo trabalhista. Programe o gozo imediatamente.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "A Vencer (30d)", value: countAVencer,  color: "text-blue-600"  },
            { label: "Vencidas",       value: countVencida,  color: "text-red-600"   },
            { label: "Agendadas",      value: countAgendada, color: "text-green-600" },
            { label: "Gozadas no Mês", value: countGozadaMes, color: "text-gray-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-lg border border-gray-200 px-4 py-3 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        <form method="GET" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap min-w-0 flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                name="q"
                defaultValue={q ?? ""}
                placeholder="Buscar funcionário..."
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-56"
              />
            </div>
            <select
              name="empresaId"
              defaultValue={empresaId ?? ""}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
            >
              <option value="">Todas as empresas</option>
              {empresas.map((e) => (
                <option key={e.id} value={e.id}>{e.nomeFantasia ?? e.razaoSocial}</option>
              ))}
            </select>
            <select
              name="status"
              defaultValue={status ?? ""}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
            >
              <option value="">Todos os status</option>
              <option value="A_VENCER">A Vencer</option>
              <option value="VENCIDA">Vencida</option>
              <option value="AGENDADA">Agendada</option>
              <option value="GOZADA">Gozada</option>
            </select>
            <button type="submit" className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 w-full sm:w-auto">
              Filtrar
            </button>
          </div>
          <Link
            href="/ferias/nova"
            className="flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Programar Férias
          </Link>
        </form>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {ferias.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Nenhum registro de férias encontrado</p>
              <p className="text-sm text-gray-400 mt-1">
                {q || status ? "Ajuste os filtros de busca." : "Clique em \"Programar Férias\" para iniciar."}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Funcionário</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Período Aquisitivo</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Vencimento</th>
                      <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Dias</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ferias.map((f) => {
                      const s = statusConfig[f.status] ?? statusConfig["A_VENCER"];
                      const StatusIcon = s.icon;
                      return (
                        <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-4">
                            <p className="text-sm font-medium text-gray-900">{f.funcionario.nome}</p>
                            <p className="text-xs text-gray-500">{f.funcionario.cargo?.descricao ?? "—"}</p>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-600">
                            {fmtDate(f.dataInicioAquisitivo)} – {fmtDate(f.dataFimAquisitivo)}
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-600">
                            {fmtDate(f.dataFimAquisitivo)}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <div className="text-sm font-medium text-gray-900">
                              {f.diasGozo !== null ? `${f.diasGozo}/${f.diasDireito}d` : `${f.diasDireito}d`}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full w-fit ${s.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {s.label}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/ferias/${f.id}`}
                                className="text-xs text-blue-600 hover:underline"
                              >
                                Calcular
                              </Link>
                              <Link
                                href={`/ferias/${f.id}`}
                                className="text-xs text-gray-500 hover:underline"
                              >
                                Editar
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">{ferias.length} registro{ferias.length !== 1 ? "s" : ""} encontrado{ferias.length !== 1 ? "s" : ""}</p>
              </div>
            </>
          )}
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-2">Regras CLT — Férias (Arts. 129–145)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
            <div>
              <p className="font-medium text-slate-700">Direito</p>
              <p>30 dias após 12 meses de trabalho. Reduções por faltas (art. 130).</p>
            </div>
            <div>
              <p className="font-medium text-slate-700">Abono Pecuniário</p>
              <p>Até 1/3 dos dias (máx. 10 dias), requerido até 15 dias antes.</p>
            </div>
            <div>
              <p className="font-medium text-slate-700">Pagamento</p>
              <p>2 dias úteis antes do início. 1/3 constitucional obrigatório.</p>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
