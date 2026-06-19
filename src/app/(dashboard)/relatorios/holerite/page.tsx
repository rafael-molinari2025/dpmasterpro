import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import Link from "next/link";
import PrintButton from "@/components/PrintButton";
import { Search, ChevronDown } from "lucide-react";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString("pt-BR");
}

function mascaraCPF(cpf: string) {
  return cpf.replace(/(\d{3})\.\d{3}\.\d{3}-(\d{2})/, "$1.***.***-$2");
}

export default async function HoleritePage({
  searchParams,
}: {
  searchParams: Promise<{ empresaId?: string; competencia?: string; funcionarioId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const escritorioId = (session.user as any).escritorioId as string;

  const hoje = new Date();
  const {
    empresaId,
    competencia = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`,
    funcionarioId,
  } = await searchParams;

  const [empresas, funcionarios] = await Promise.all([
    db.empresa.findMany({
      where: { escritorioId, ativa: true },
      select: { id: true, nomeFantasia: true, razaoSocial: true },
      orderBy: { razaoSocial: "asc" },
    }),
    empresaId
      ? db.funcionario.findMany({
          where: { empresaId, situacao: { not: "DEMITIDO" } },
          select: { id: true, nome: true, matricula: true },
          orderBy: { nome: "asc" },
        })
      : Promise.resolve([]),
  ]);

  // Busca itens do holerite
  let itensAgrupados: {
    funcionario: any;
    empresa: any;
    itens: any[];
    totalProventos: number;
    totalDescontos: number;
    liquido: number;
    fgts: number;
  }[] = [];

  if (empresaId && competencia) {
    const itens = await db.itemFolha.findMany({
      where: {
        folha: { empresaId, competencia, empresa: { escritorioId } },
        ...(funcionarioId && { funcionarioId }),
      },
      include: {
        funcionario: {
          select: {
            id: true,
            nome: true,
            cpf: true,
            matricula: true,
            dataAdmissao: true,
            salario: true,
            pisPasep: true,
            cargo: { select: { descricao: true } },
            setor: { select: { descricao: true } },
          },
        },
        rubrica: { select: { codigo: true, descricao: true } },
        folha: {
          select: {
            competencia: true,
            empresa: { select: { razaoSocial: true, nomeFantasia: true, cnpj: true } },
          },
        },
      },
    });

    // Agrupar por funcionário
    const grupos: Record<string, typeof itensAgrupados[0]> = {};
    for (const item of itens) {
      const fid = item.funcionarioId;
      if (!grupos[fid]) {
        grupos[fid] = {
          funcionario: item.funcionario,
          empresa: item.folha.empresa,
          itens: [],
          totalProventos: 0,
          totalDescontos: 0,
          liquido: 0,
          fgts: 0,
        };
      }
      const v = parseFloat(item.valor.toString());
      grupos[fid].itens.push(item);
      if (item.tipo === "PROVENTO") grupos[fid].totalProventos += v;
      if (item.tipo === "DESCONTO") grupos[fid].totalDescontos += v;
      // FGTS vem do item INFORMATIVO com rubrica 9001
      if (item.tipo === "INFORMATIVO" && item.rubrica?.codigo === "9001") grupos[fid].fgts += v;
    }
    for (const g of Object.values(grupos)) {
      g.liquido = g.totalProventos - g.totalDescontos;
      // Fallback: se não houver item FGTS, estima 8% dos proventos
      if (g.fgts === 0) g.fgts = Math.round(g.totalProventos * 0.08 * 100) / 100;
    }
    itensAgrupados = Object.values(grupos);
  }

  const [ano, mes] = competencia.split("-");
  const labelComp = new Date(parseInt(ano), parseInt(mes) - 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  const labelCap = labelComp.charAt(0).toUpperCase() + labelComp.slice(1);

  return (
    <>
      <Header title="Holerite / Contracheque" subtitle="Emissão e impressão de holerites" />
      <div className="flex-1 p-3 sm:p-6 space-y-6">

        {/* Filtros */}
        <form method="GET" className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-full sm:w-auto">
              <label className="text-xs text-gray-500 block mb-1">Competência</label>
              <input
                type="month"
                name="competencia"
                defaultValue={competencia}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="w-full sm:w-auto">
              <label className="text-xs text-gray-500 block mb-1">Empresa</label>
              <select
                name="empresaId"
                defaultValue={empresaId ?? ""}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione...</option>
                {empresas.map((e) => (
                  <option key={e.id} value={e.id}>{e.nomeFantasia ?? e.razaoSocial}</option>
                ))}
              </select>
            </div>
            {funcionarios.length > 0 && (
              <div className="w-full sm:w-auto">
                <label className="text-xs text-gray-500 block mb-1">Funcionário (opcional)</label>
                <select
                  name="funcionarioId"
                  defaultValue={funcionarioId ?? ""}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos</option>
                  {funcionarios.map((f) => (
                    <option key={f.id} value={f.id}>{f.nome}</option>
                  ))}
                </select>
              </div>
            )}
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              Consultar
            </button>
            {itensAgrupados.length > 0 && (
              <PrintButton
                label="Imprimir Todos"
                className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              />
            )}
          </div>
        </form>

        {/* Estado vazio */}
        {!empresaId && (
          <div className="bg-white rounded-xl border border-gray-200 text-center py-16">
            <p className="text-gray-500 font-medium">Selecione a empresa e a competência</p>
            <p className="text-sm text-gray-400 mt-1">Os holerites serão exibidos após a consulta.</p>
          </div>
        )}

        {empresaId && itensAgrupados.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 text-center py-16">
            <p className="text-gray-500 font-medium">Nenhum holerite encontrado para {labelCap}</p>
            <p className="text-sm text-gray-400 mt-1">Processe a folha de pagamento primeiro.</p>
            <Link
              href="/folha/processar"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
            >
              Processar Folha
            </Link>
          </div>
        )}

        {/* Holerites */}
        {itensAgrupados.map((grupo) => (
          <div
            key={grupo.funcionario.id}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden print:break-after-page"
          >
            {/* Cabeçalho */}
            <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap justify-between items-start gap-3">
              <div>
                <p className="text-base font-bold">
                  {grupo.empresa.nomeFantasia ?? grupo.empresa.razaoSocial}
                </p>
                <p className="text-slate-400 text-xs mt-0.5">CNPJ: {grupo.empresa.cnpj}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">CONTRACHEQUE</p>
                <p className="text-slate-400 text-xs">Competência: {labelCap}</p>
              </div>
            </div>

            {/* Dados do funcionário */}
            <div className="px-6 py-4 border-b border-gray-100 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <p className="text-gray-500">Funcionário</p>
                <p className="font-medium text-gray-900 mt-0.5">{grupo.funcionario.nome}</p>
              </div>
              <div>
                <p className="text-gray-500">Matrícula / CPF</p>
                <p className="font-medium text-gray-900 mt-0.5">
                  {grupo.funcionario.matricula} / {mascaraCPF(grupo.funcionario.cpf)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Cargo / Setor</p>
                <p className="font-medium text-gray-900 mt-0.5">
                  {grupo.funcionario.cargo?.descricao ?? "—"} / {grupo.funcionario.setor?.descricao ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Admissão</p>
                <p className="font-medium text-gray-900 mt-0.5">
                  {fmtDate(grupo.funcionario.dataAdmissao)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Salário Base</p>
                <p className="font-medium text-gray-900 mt-0.5">
                  R$ {fmt(parseFloat(grupo.funcionario.salario.toString()))}
                </p>
              </div>
              <div>
                <p className="text-gray-500">PIS/NIT</p>
                <p className="font-medium text-gray-900 mt-0.5">{grupo.funcionario.pisPasep ?? "—"}</p>
              </div>
            </div>

            {/* Itens */}
            <div className="px-4 sm:px-6 py-4">
              {/* Lista (mobile) */}
              <div className="sm:hidden divide-y divide-gray-50">
                {grupo.itens.map((item) => (
                  <div key={item.id} className="py-2 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-gray-400">{item.rubrica?.codigo ?? "—"}</p>
                      <p className="text-xs text-gray-700 truncate">{item.descricao}</p>
                    </div>
                    <span className={`text-xs font-medium flex-shrink-0 ${item.tipo === "PROVENTO" ? "text-green-700" : "text-red-600"}`}>
                      {item.tipo === "PROVENTO" ? "+" : "-"}{fmt(parseFloat(item.valor.toString()))}
                    </span>
                  </div>
                ))}
                <div className="pt-2 flex justify-between text-xs font-bold border-t-2 border-gray-300 mt-1">
                  <span className="text-gray-500">Proventos</span>
                  <span className="text-green-700">R$ {fmt(grupo.totalProventos)}</span>
                </div>
                <div className="py-1 flex justify-between text-xs font-bold">
                  <span className="text-gray-500">Descontos</span>
                  <span className="text-red-600">R$ {fmt(grupo.totalDescontos)}</span>
                </div>
              </div>
              {/* Tabela (tablet/desktop) */}
              <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-xs min-w-[500px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-gray-500 font-medium">Cód.</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Descrição</th>
                    <th className="text-right py-2 text-green-600 font-medium">Proventos</th>
                    <th className="text-right py-2 text-red-600 font-medium">Descontos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {grupo.itens.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2 font-mono text-gray-500">
                        {item.rubrica?.codigo ?? "—"}
                      </td>
                      <td className="py-2 text-gray-700">{item.descricao}</td>
                      <td className="py-2 text-right text-green-700 font-medium">
                        {item.tipo === "PROVENTO" ? fmt(parseFloat(item.valor.toString())) : ""}
                      </td>
                      <td className="py-2 text-right text-red-600 font-medium">
                        {item.tipo === "DESCONTO" ? fmt(parseFloat(item.valor.toString())) : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-gray-300">
                  <tr>
                    <td colSpan={2} className="pt-3 text-gray-500">Totais</td>
                    <td className="pt-3 text-right font-bold text-green-700">
                      R$ {fmt(grupo.totalProventos)}
                    </td>
                    <td className="pt-3 text-right font-bold text-red-600">
                      R$ {fmt(grupo.totalDescontos)}
                    </td>
                  </tr>
                </tfoot>
              </table>
              </div>
            </div>

            {/* Rodapé */}
            <div className="bg-slate-900 px-6 py-3 flex flex-wrap justify-between gap-3 text-xs text-white">
              <div>
                <span className="text-slate-400">Salário Líquido: </span>
                <span className="font-bold text-lg">R$ {fmt(grupo.liquido)}</span>
              </div>
              <div className="text-right text-slate-400">
                <p>FGTS do Mês: R$ {fmt(grupo.fgts)}</p>
              </div>
            </div>
          </div>
        ))}

      </div>
    </>
  );
}
