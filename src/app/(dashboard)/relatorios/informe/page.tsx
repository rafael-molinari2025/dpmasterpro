import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import { FileText, Download, Users } from "lucide-react";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function InformeRendimentosPage({
  searchParams,
}: {
  searchParams: Promise<{ empresaId?: string; ano?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const escritorioId = (session.user as any).escritorioId as string;

  const hoje = new Date();
  const { empresaId, ano: anoParam } = await searchParams;
  const ano = parseInt(anoParam ?? String(hoje.getFullYear() - 1));

  const [empresas, folhasDoAno] = await Promise.all([
    db.empresa.findMany({
      where: { escritorioId, ativa: true },
      select: { id: true, nomeFantasia: true, razaoSocial: true },
      orderBy: { razaoSocial: "asc" },
    }),
    empresaId
      ? db.folha.findMany({
          where: {
            empresa: { escritorioId },
            empresaId,
            competencia: { startsWith: String(ano) },
            status: "FECHADA",
          },
          include: {
            itens: {
              include: { funcionario: { select: { id: true, nome: true, cpf: true, matricula: true } } },
            },
          },
        })
      : [],
  ]);

  // Agrupa por funcionário
  const porFuncionario: Record<string, { nome: string; cpf: string; matricula: string; rendimentos: number; irrf: number; inss: number }> = {};
  for (const folha of folhasDoAno) {
    for (const item of folha.itens) {
      const f = item.funcionario;
      if (!porFuncionario[f.id]) {
        porFuncionario[f.id] = { nome: f.nome, cpf: f.cpf, matricula: f.matricula, rendimentos: 0, irrf: 0, inss: 0 };
      }
      const valor = parseFloat(item.valor.toString());
      if (item.tipo === "PROVENTO") porFuncionario[f.id].rendimentos += valor;
      else if (item.tipo === "DESCONTO") {
        const rubricaDesc = (item as any).descricao ?? "";
        if (rubricaDesc.includes("IRRF")) porFuncionario[f.id].irrf += valor;
        else if (rubricaDesc.includes("INSS")) porFuncionario[f.id].inss += valor;
      }
    }
  }

  const funcionariosLista = Object.entries(porFuncionario);

  function mascaraCPF(cpf: string) {
    return cpf.replace(/(\d{3})\.\d{3}\.\d{3}-(\d{2})/, "$1.***.***-$2");
  }

  return (
    <>
      <Header title="Informe de Rendimentos" subtitle={`Ano-calendário ${ano}`} />
      <div className="flex-1 p-3 sm:p-6 space-y-6">

        <form method="GET" className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <select
              name="empresaId"
              defaultValue={empresaId ?? ""}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione uma empresa</option>
              {empresas.map((e) => (
                <option key={e.id} value={e.id}>{e.nomeFantasia ?? e.razaoSocial}</option>
              ))}
            </select>
            <select
              name="ano"
              defaultValue={String(ano)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[hoje.getFullYear() - 1, hoje.getFullYear() - 2, hoje.getFullYear() - 3].map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <button type="submit" className="px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Gerar
            </button>
          </div>
          {funcionariosLista.length > 0 && (
            <button type="button" className="flex items-center gap-2 px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              <Download className="w-4 h-4" />
              Exportar todos (PDF)
            </button>
          )}
        </form>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {!empresaId ? (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Selecione uma empresa para gerar os informes</p>
            </div>
          ) : funcionariosLista.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Nenhum dado de folha fechada para o ano {ano}</p>
              <p className="text-sm text-gray-400 mt-1">Feche as folhas do ano-calendário {ano} para gerar os informes.</p>
            </div>
          ) : (
            <>
              {/* Cards (mobile) */}
              <div className="sm:hidden divide-y divide-gray-100">
                {funcionariosLista.map(([id, f]) => (
                  <div key={id} className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{f.nome}</p>
                        <p className="text-xs font-mono text-gray-400">{mascaraCPF(f.cpf)} · {f.matricula}</p>
                      </div>
                      <button type="button" className="flex-shrink-0 flex items-center gap-1 text-xs text-blue-600 hover:underline">
                        <Download className="w-3 h-3" />
                        PDF
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 mt-2">
                      <p><span className="text-gray-400">Rendimentos:</span><br />R$ {fmt(f.rendimentos)}</p>
                      <p><span className="text-gray-400">INSS:</span><br />R$ {fmt(f.inss)}</p>
                      <p><span className="text-gray-400">IRRF:</span><br />R$ {fmt(f.irrf)}</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Tabela (tablet/desktop) */}
              <div className="hidden sm:block overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Matrícula</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Funcionário</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">CPF</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Rendimentos Brutos</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">INSS Retido</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">IRRF Retido</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {funcionariosLista.map(([id, f]) => (
                    <tr key={id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-sm font-mono text-gray-500">{f.matricula}</td>
                      <td className="px-5 py-3 text-sm font-medium text-gray-900">{f.nome}</td>
                      <td className="px-5 py-3 text-sm font-mono text-gray-500">{mascaraCPF(f.cpf)}</td>
                      <td className="px-5 py-3 text-sm text-right font-medium text-gray-900">R$ {fmt(f.rendimentos)}</td>
                      <td className="px-5 py-3 text-sm text-right text-gray-700">R$ {fmt(f.inss)}</td>
                      <td className="px-5 py-3 text-sm text-right text-gray-700">R$ {fmt(f.irrf)}</td>
                      <td className="px-5 py-3">
                        <button type="button" className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                          <Download className="w-3 h-3" />
                          PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              <div className="px-5 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">{funcionariosLista.length} informe{funcionariosLista.length !== 1 ? "s" : ""} — Ano-calendário {ano}</p>
              </div>
            </>
          )}
        </div>

      </div>
    </>
  );
}
