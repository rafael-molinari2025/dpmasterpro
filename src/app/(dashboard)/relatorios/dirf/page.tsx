import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import { FileText, Info, Calendar, Download } from "lucide-react";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function DIRFPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string; empresaId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const escritorioId = (session.user as any).escritorioId as string;

  const anoAtual = new Date().getFullYear();
  const { ano: anoParam, empresaId } = await searchParams;
  const ano = parseInt(anoParam ?? String(anoAtual - 1));

  const empresas = await db.empresa.findMany({
    where: { escritorioId, ativa: true },
    select: { id: true, razaoSocial: true, nomeFantasia: true, cnpj: true },
    orderBy: { razaoSocial: "asc" },
  });

  const empresaFiltro = empresaId && empresas.find((e) => e.id === empresaId) ? empresaId : undefined;

  const folhasFechadas = await db.folha.findMany({
    where: {
      empresa: { escritorioId },
      ...(empresaFiltro && { empresaId: empresaFiltro }),
      status: "FECHADA",
      competencia: { startsWith: String(ano) },
    },
    select: {
      id: true,
      empresaId: true,
      competencia: true,
      totalIRRF: true,
      totalProventos: true,
      empresa: { select: { razaoSocial: true, nomeFantasia: true, cnpj: true } },
    },
  });

  const itensFuncionario = await db.itemFolha.findMany({
    where: {
      folha: {
        empresa: { escritorioId },
        ...(empresaFiltro && { empresaId: empresaFiltro }),
        status: "FECHADA",
        competencia: { startsWith: String(ano) },
      },
      tipo: "DESCONTO",
      descricao: { contains: "IRRF", mode: "insensitive" },
    },
    select: {
      funcionarioId: true,
      valor: true,
      funcionario: {
        select: {
          nome: true,
          cpf: true,
          empresa: { select: { razaoSocial: true, nomeFantasia: true } },
        },
      },
    },
  });

  // Group by funcionarioId
  const porFuncionario = new Map<string, { nome: string; cpf: string; empresa: string; irrf: number }>();
  for (const item of itensFuncionario) {
    const key = item.funcionarioId;
    const existing = porFuncionario.get(key);
    const irrfVal = parseFloat(item.valor.toString());
    if (existing) {
      existing.irrf += irrfVal;
    } else {
      porFuncionario.set(key, {
        nome: item.funcionario.nome,
        cpf: item.funcionario.cpf,
        empresa: item.funcionario.empresa.nomeFantasia ?? item.funcionario.empresa.razaoSocial,
        irrf: irrfVal,
      });
    }
  }

  // Group folhas por empresa
  const porEmpresa = new Map<string, { nome: string; cnpj: string; irrf: number; proventos: number; competencias: number }>();
  for (const f of folhasFechadas) {
    const key = f.empresaId;
    const existing = porEmpresa.get(key);
    const irrf = parseFloat(f.totalIRRF.toString());
    const prov = parseFloat(f.totalProventos.toString());
    if (existing) {
      existing.irrf += irrf;
      existing.proventos += prov;
      existing.competencias += 1;
    } else {
      porEmpresa.set(key, {
        nome: f.empresa.nomeFantasia ?? f.empresa.razaoSocial,
        cnpj: f.empresa.cnpj,
        irrf,
        proventos: prov,
        competencias: 1,
      });
    }
  }

  const totalIRRF = [...porEmpresa.values()].reduce((s, e) => s + e.irrf, 0);
  const funcionariosComIRRF = [...porFuncionario.values()].filter((f) => f.irrf > 0);

  return (
    <>
      <Header title="DIRF" subtitle={`Declaração do IRRF — Ano-base ${ano}`} />
      <div className="flex-1 p-3 sm:p-6 space-y-6">

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">DIRF — Declaração do Imposto sobre a Renda Retido na Fonte</p>
            <p className="mt-0.5 text-blue-700">
              Prazo de entrega: até o último dia útil de fevereiro de <strong>{ano + 1}</strong> pelo programa <strong>PGD DIRF</strong>.
              Penalidade por atraso: R$ 500 a R$ 1.500 por mês/fração.
            </p>
          </div>
        </div>

        {/* Filtros */}
        <form method="GET" className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Ano-base</label>
            <select
              name="ano"
              defaultValue={String(ano)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[anoAtual - 1, anoAtual - 2, anoAtual - 3].map((y) => (
                <option key={y} value={String(y)}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Empresa</label>
            <select
              name="empresaId"
              defaultValue={empresaId ?? ""}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as empresas</option>
              {empresas.map((e) => (
                <option key={e.id} value={e.id}>{e.nomeFantasia ?? e.razaoSocial}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            Filtrar
          </button>
        </form>

        {/* Resumo por empresa */}
        {porEmpresa.size > 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Resumo por Empresa — Ano-base {ano}
              </h2>
              <span className="text-xs text-gray-500">{porEmpresa.size} empresa{porEmpresa.size !== 1 ? "s" : ""}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Empresa</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">CNPJ</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Competências</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Base Proventos</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Total IRRF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[...porEmpresa.values()].map((e) => (
                    <tr key={e.cnpj} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-sm font-medium text-gray-900">{e.nome}</td>
                      <td className="px-5 py-3 text-sm font-mono text-gray-500">{e.cnpj}</td>
                      <td className="px-5 py-3 text-sm text-right text-gray-700">{e.competencias}</td>
                      <td className="px-5 py-3 text-sm text-right text-gray-900">R$ {fmt(e.proventos)}</td>
                      <td className="px-5 py-3 text-sm text-right font-medium text-blue-700">R$ {fmt(e.irrf)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td colSpan={4} className="px-5 py-3 text-xs font-semibold text-gray-700">TOTAL IRRF RETIDO</td>
                    <td className="px-5 py-3 text-sm text-right font-bold text-blue-700">R$ {fmt(totalIRRF)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 text-center py-16">
            <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nenhuma folha fechada encontrada para {ano}</p>
            <p className="text-sm text-gray-400 mt-1">Processe e feche as folhas do ano-base para gerar a DIRF.</p>
          </div>
        )}

        {/* Beneficiários com IRRF */}
        {funcionariosComIRRF.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Beneficiários com IRRF Retido</h2>
              <Download className="w-4 h-4 text-gray-400" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Beneficiário</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">CPF</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Empresa</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">IRRF Retido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {funcionariosComIRRF.map((f, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-sm font-medium text-gray-900">{f.nome}</td>
                      <td className="px-5 py-3 text-sm font-mono text-gray-500">
                        {f.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600">{f.empresa}</td>
                      <td className="px-5 py-3 text-sm text-right font-medium text-blue-700">R$ {fmt(f.irrf)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">{funcionariosComIRRF.length} beneficiário{funcionariosComIRRF.length !== 1 ? "s" : ""} com retenção de IRRF em {ano}</p>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
