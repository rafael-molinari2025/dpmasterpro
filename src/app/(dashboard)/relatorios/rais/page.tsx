import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import { FileText, Info, Users, Building2 } from "lucide-react";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function RAISPage({
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

  const inicioAno = new Date(`${ano}-01-01`);
  const fimAno = new Date(`${ano}-12-31T23:59:59`);

  const empresas = await db.empresa.findMany({
    where: { escritorioId, ativa: true },
    select: { id: true, razaoSocial: true, nomeFantasia: true, cnpj: true },
    orderBy: { razaoSocial: "asc" },
  });

  const empresaFiltro = empresaId && empresas.find((e) => e.id === empresaId) ? empresaId : undefined;
  const empresasAlvo = empresaFiltro ? empresas.filter((e) => e.id === empresaFiltro) : empresas;

  // Fetch all funcionarios for target companies
  const funcionarios = await db.funcionario.findMany({
    where: {
      empresa: { escritorioId },
      ...(empresaFiltro && { empresaId: empresaFiltro }),
      OR: [
        { dataAdmissao: { lte: fimAno } },
      ],
    },
    select: {
      id: true,
      nome: true,
      cpf: true,
      matricula: true,
      sexo: true,
      escolaridade: true,
      dataAdmissao: true,
      dataDemissao: true,
      situacao: true,
      salario: true,
      tipoContrato: true,
      empresaId: true,
      cargo: { select: { descricao: true } },
      empresa: { select: { razaoSocial: true, nomeFantasia: true } },
    },
  });

  // Filter: employees who had any activity in the year (admitted before end of year, demitido after start or still active)
  const funcNoAno = funcionarios.filter((f) => {
    const admitido = new Date(f.dataAdmissao) <= fimAno;
    const naoSaiuAntes = !f.dataDemissao || new Date(f.dataDemissao) >= inicioAno;
    return admitido && naoSaiuAntes;
  });

  const admitidosNoAno = funcNoAno.filter((f) => {
    const adm = new Date(f.dataAdmissao);
    return adm >= inicioAno && adm <= fimAno;
  });

  const demitidosNoAno = funcNoAno.filter((f) => {
    if (!f.dataDemissao) return false;
    const dem = new Date(f.dataDemissao);
    return dem >= inicioAno && dem <= fimAno;
  });

  const ativos = funcNoAno.filter((f) => f.situacao !== "DEMITIDO");
  const totalMassaSalarial = funcNoAno.reduce((s, f) => s + parseFloat(f.salario.toString()), 0);

  // Group by empresa
  const porEmpresa = empresasAlvo.map((emp) => {
    const empFunc = funcNoAno.filter((f) => f.empresaId === emp.id);
    const empAdm = admitidosNoAno.filter((f) => f.empresaId === emp.id);
    const empDem = demitidosNoAno.filter((f) => f.empresaId === emp.id);
    const empAtivos = ativos.filter((f) => f.empresaId === emp.id);
    const massa = empFunc.reduce((s, f) => s + parseFloat(f.salario.toString()), 0);
    return { emp, total: empFunc.length, admitidos: empAdm.length, demitidos: empDem.length, ativos: empAtivos.length, massa };
  }).filter((r) => r.total > 0);

  return (
    <>
      <Header title="RAIS" subtitle={`Relação Anual de Informações Sociais — Ano-base ${ano}`} />
      <div className="flex-1 p-3 sm:p-6 space-y-6">

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">RAIS — Relação Anual de Informações Sociais</p>
            <p className="mt-0.5 text-blue-700">
              Obrigação acessória anual entregue ao MTE. Declaração do ano-base <strong>{ano}</strong> deve ser entregue
              entre janeiro e março de <strong>{ano + 1}</strong> pelo programa <strong>GDRAIS</strong> ou via eSocial.
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

        {/* Stats gerais */}
        {funcNoAno.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Vínculos no Ano", value: funcNoAno.length, color: "text-gray-900" },
              { label: "Admitidos em " + ano, value: admitidosNoAno.length, color: "text-green-700" },
              { label: "Demitidos em " + ano, value: demitidosNoAno.length, color: "text-red-700" },
              { label: "Ativos em 31/12", value: ativos.length, color: "text-blue-700" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-200 px-4 py-4">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Resumo por empresa */}
        {porEmpresa.length > 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <h2 className="font-semibold text-gray-900">Resumo por Empresa — {ano}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Empresa</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Total</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Admitidos</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Demitidos</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Ativos 31/12</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Massa Salarial</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {porEmpresa.map(({ emp, total, admitidos, demitidos, ativos: atv, massa }) => (
                    <tr key={emp.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-gray-900">{emp.nomeFantasia ?? emp.razaoSocial}</p>
                        <p className="text-xs text-gray-400 font-mono">{emp.cnpj}</p>
                      </td>
                      <td className="px-5 py-3 text-sm text-right text-gray-900">{total}</td>
                      <td className="px-5 py-3 text-sm text-right text-green-700">{admitidos}</td>
                      <td className="px-5 py-3 text-sm text-right text-red-700">{demitidos}</td>
                      <td className="px-5 py-3 text-sm text-right text-blue-700">{atv}</td>
                      <td className="px-5 py-3 text-sm text-right font-medium text-gray-900">R$ {fmt(massa)}</td>
                    </tr>
                  ))}
                </tbody>
                {porEmpresa.length > 1 && (
                  <tfoot className="bg-gray-50 border-t border-gray-200">
                    <tr>
                      <td className="px-5 py-3 text-xs font-semibold text-gray-700">TOTAIS</td>
                      <td className="px-5 py-3 text-sm text-right font-bold text-gray-900">{funcNoAno.length}</td>
                      <td className="px-5 py-3 text-sm text-right font-bold text-green-700">{admitidosNoAno.length}</td>
                      <td className="px-5 py-3 text-sm text-right font-bold text-red-700">{demitidosNoAno.length}</td>
                      <td className="px-5 py-3 text-sm text-right font-bold text-blue-700">{ativos.length}</td>
                      <td className="px-5 py-3 text-sm text-right font-bold text-gray-900">R$ {fmt(totalMassaSalarial)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 text-center py-16">
            <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nenhum vínculo encontrado para {ano}</p>
            <p className="text-sm text-gray-400 mt-1">Cadastre funcionários para gerar a RAIS.</p>
          </div>
        )}

        {/* Lista de funcionários */}
        {funcNoAno.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Vínculos Empregatícios — {ano}
              </h2>
              <span className="text-xs text-gray-500">{funcNoAno.length} vínculo{funcNoAno.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Funcionário</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Cargo</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Admissão</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Demissão</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Salário</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {funcNoAno.map((f) => (
                    <tr key={f.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-gray-900">{f.nome}</p>
                        <p className="text-xs text-gray-400">{f.empresa.nomeFantasia ?? f.empresa.razaoSocial}</p>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600">{f.cargo?.descricao ?? "—"}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">
                        {new Date(f.dataAdmissao).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600">
                        {f.dataDemissao
                          ? new Date(f.dataDemissao).toLocaleDateString("pt-BR", { timeZone: "UTC" })
                          : "—"}
                      </td>
                      <td className="px-5 py-3 text-sm text-right font-medium text-gray-900">
                        R$ {fmt(parseFloat(f.salario.toString()))}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          f.situacao === "ATIVO" ? "bg-green-50 text-green-700"
                          : f.situacao === "DEMITIDO" ? "bg-red-50 text-red-700"
                          : f.situacao === "FERIAS" ? "bg-blue-50 text-blue-700"
                          : "bg-amber-50 text-amber-700"
                        }`}>
                          {f.situacao}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Massa salarial total: <strong>R$ {fmt(totalMassaSalarial)}</strong>
              </p>
            </div>
          </div>
        )}

        {/* Info PGD */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <p className="text-sm font-medium text-slate-800 mb-1">Entrega da RAIS</p>
          <p className="text-sm text-slate-600">
            A RAIS deve ser transmitida pelo programa <strong>GDRAIS</strong> disponível no portal do MTE ou,
            para empresas já no eSocial, a entrega da RAIS é feita automaticamente via eSocial.
            Empresa sem vínculos deve entregar RAIS Negativa.
          </p>
        </div>

      </div>
    </>
  );
}
