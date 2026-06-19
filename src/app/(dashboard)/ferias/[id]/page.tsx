import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import { ArrowLeft, AlertCircle, Calendar, User, Clock, Printer } from "lucide-react";
import { atualizarFerias, cancelarFerias } from "./actions";
import { calcularINSS, calcularIRRF } from "@/lib/calculo-folha";
import PrintButton from "@/components/PrintButton";

const STATUS_INFO: Record<string, { label: string; cls: string }> = {
  A_VENCER:  { label: "A Vencer",  cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  VENCIDA:   { label: "Vencida",   cls: "bg-red-50 text-red-700 border-red-200" },
  AGENDADA:  { label: "Agendada",  cls: "bg-blue-50 text-blue-700 border-blue-200" },
  GOZADA:    { label: "Gozada",    cls: "bg-green-50 text-green-700 border-green-200" },
  CANCELADA: { label: "Cancelada", cls: "bg-gray-50 text-gray-500 border-gray-200" },
};

function fmtDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function toInputDate(d: Date | null | undefined) {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0];
}

function calcularRecibo(params: {
  salario: number;
  diasGozo: number;
  diasAbono: number;
  numDependentes: number;
  adiantamento13: boolean;
}) {
  const { salario, diasGozo, diasAbono, numDependentes, adiantamento13 } = params;
  const diasFerias = diasGozo - diasAbono;
  const valorFerias = Math.round((salario / 30) * diasFerias * 100) / 100;
  const valorTerceiro = Math.round(valorFerias / 3 * 100) / 100;
  const valorAbono = diasAbono > 0 ? Math.round((salario / 30) * diasAbono * (4 / 3) * 100) / 100 : 0;
  const baseINSS = valorFerias + valorTerceiro;
  const valorINSS = calcularINSS(baseINSS);
  const baseIRRF = Math.max(0, valorFerias + valorTerceiro - valorINSS);
  const valorIRRF = calcularIRRF(baseIRRF, numDependentes);
  const totalBruto = valorFerias + valorTerceiro + valorAbono;
  const totalDescontos = valorINSS + valorIRRF;
  const valorLiquido = totalBruto - totalDescontos;
  return { valorFerias, valorTerceiro, valorAbono, valorINSS, valorIRRF, totalBruto, totalDescontos, valorLiquido };
}

export default async function FeriasDetalhePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const escritorioId = (session.user as any).escritorioId as string;

  const { id } = await params;
  const { error } = await searchParams;

  const ferias = await db.ferias.findFirst({
    where: { id, empresa: { escritorioId } },
    include: {
      funcionario: {
        select: {
          nome: true,
          matricula: true,
          cpf: true,
          dataAdmissao: true,
          salario: true,
          cargo: { select: { descricao: true } },
          setor: { select: { descricao: true } },
          dependentes: { where: { deducaoIRRF: true }, select: { id: true } },
        },
      },
      empresa: {
        select: { razaoSocial: true, nomeFantasia: true, cnpj: true },
      },
    },
  });

  if (!ferias) notFound();

  const canEdit = ferias.status !== "GOZADA" && ferias.status !== "CANCELADA";
  const statusInfo = STATUS_INFO[ferias.status] ?? { label: ferias.status, cls: "bg-gray-50 text-gray-700 border-gray-200" };

  // Calcular recibo se houver gozo programado
  const salario = parseFloat(ferias.funcionario.salario.toString());
  const numDependentes = ferias.funcionario.dependentes.length;
  const recibo = ferias.diasGozo
    ? calcularRecibo({
        salario,
        diasGozo: ferias.diasGozo,
        diasAbono: ferias.diasAbono,
        numDependentes,
        adiantamento13: ferias.adiantamento13,
      })
    : null;

  const hoje = new Date();
  const dataEmissao = hoje.toLocaleDateString("pt-BR");

  return (
    <>
      <Header title="Detalhes das Férias" subtitle={ferias.funcionario.nome} />
      <div className="flex-1 p-3 sm:p-6">
        <div className="max-w-2xl mx-auto space-y-5">

          <div className="flex items-center justify-between flex-wrap gap-3">
            <a href="/ferias" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-4 h-4" />
              Voltar para Férias
            </a>
            {recibo && (
              <PrintButton
                label="Imprimir Recibo"
                className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              />
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{decodeURIComponent(error)}</p>
            </div>
          )}

          {/* Info card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                Dados do Funcionário
              </h2>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusInfo.cls}`}>
                {statusInfo.label}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div><p className="text-xs text-gray-500">Funcionário</p><p className="font-medium text-gray-900 mt-0.5">{ferias.funcionario.nome}</p></div>
              <div><p className="text-xs text-gray-500">Matrícula</p><p className="font-medium text-gray-900 mt-0.5">{ferias.funcionario.matricula}</p></div>
              <div><p className="text-xs text-gray-500">Cargo / Setor</p><p className="font-medium text-gray-900 mt-0.5">{ferias.funcionario.cargo?.descricao ?? "—"} / {ferias.funcionario.setor?.descricao ?? "—"}</p></div>
              <div><p className="text-xs text-gray-500">Empresa</p><p className="font-medium text-gray-900 mt-0.5">{ferias.empresa.nomeFantasia ?? ferias.empresa.razaoSocial}</p></div>
              <div><p className="text-xs text-gray-500">Admissão</p><p className="font-medium text-gray-900 mt-0.5">{fmtDate(ferias.funcionario.dataAdmissao)}</p></div>
              <div><p className="text-xs text-gray-500">Salário Base</p><p className="font-medium text-gray-900 mt-0.5">R$ {fmt(salario)}</p></div>
            </div>
          </div>

          {/* Período aquisitivo */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Período Aquisitivo
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div><p className="text-xs text-gray-500">Início Aquisitivo</p><p className="font-medium text-gray-900 mt-0.5">{fmtDate(ferias.dataInicioAquisitivo)}</p></div>
              <div><p className="text-xs text-gray-500">Fim Aquisitivo</p><p className="font-medium text-gray-900 mt-0.5">{fmtDate(ferias.dataFimAquisitivo)}</p></div>
              <div><p className="text-xs text-gray-500">Dias de Direito</p><p className="font-medium text-gray-900 mt-0.5">{ferias.diasDireito} dias</p></div>
            </div>
          </div>

          {/* Recibo de Férias — calculado */}
          {recibo && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden print:break-inside-avoid">
              {/* Cabeçalho do recibo (para impressão) */}
              <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap justify-between items-start gap-3">
                <div>
                  <p className="text-base font-bold">{ferias.empresa.nomeFantasia ?? ferias.empresa.razaoSocial}</p>
                  <p className="text-slate-400 text-xs mt-0.5">CNPJ: {ferias.empresa.cnpj}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">RECIBO DE FÉRIAS</p>
                  <p className="text-slate-400 text-xs">Emissão: {dataEmissao}</p>
                </div>
              </div>

              <div className="p-5 space-y-5">
                {/* Período de gozo */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pb-4 border-b border-gray-100">
                  <div><p className="text-gray-500">Início do Gozo</p><p className="font-medium text-gray-900 mt-0.5">{fmtDate(ferias.dataInicioGozo)}</p></div>
                  <div><p className="text-gray-500">Fim do Gozo</p><p className="font-medium text-gray-900 mt-0.5">{fmtDate(ferias.dataFimGozo)}</p></div>
                  <div><p className="text-gray-500">Dias Gozados</p><p className="font-medium text-gray-900 mt-0.5">{ferias.diasGozo - ferias.diasAbono}d</p></div>
                  <div><p className="text-gray-500">Abono Pecuniário</p><p className="font-medium text-gray-900 mt-0.5">{ferias.diasAbono}d</p></div>
                </div>

                {/* Valores */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Proventos</h3>
                    <div className="space-y-2 text-sm">
                      {[
                        { label: `Férias (${ferias.diasGozo - ferias.diasAbono} dias)`, valor: recibo.valorFerias },
                        { label: "1/3 Constitucional", valor: recibo.valorTerceiro },
                        ...(ferias.diasAbono > 0 ? [{ label: `Abono Pecuniário (${ferias.diasAbono} dias)`, valor: recibo.valorAbono }] : []),
                      ].map((item) => (
                        <div key={item.label} className="flex justify-between">
                          <span className="text-gray-600">{item.label}</span>
                          <span className="font-medium text-gray-900">R$ {fmt(item.valor)}</span>
                        </div>
                      ))}
                      <div className="border-t pt-2 flex justify-between font-bold">
                        <span>Total Bruto</span>
                        <span className="text-green-700">R$ {fmt(recibo.totalBruto)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Descontos</h3>
                    <div className="space-y-2 text-sm">
                      {[
                        { label: "INSS", valor: recibo.valorINSS },
                        { label: "IRRF", valor: recibo.valorIRRF },
                      ].map((item) => (
                        <div key={item.label} className="flex justify-between">
                          <span className="text-gray-600">{item.label}</span>
                          <span className="font-medium text-red-600">- R$ {fmt(item.valor)}</span>
                        </div>
                      ))}
                      <div className="border-t pt-2 flex justify-between font-bold">
                        <span>Total Descontos</span>
                        <span className="text-red-600">- R$ {fmt(recibo.totalDescontos)}</span>
                      </div>
                    </div>

                    <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-xs text-green-700">Valor Líquido a Receber</p>
                      <p className="text-2xl font-bold text-green-800 mt-1">R$ {fmt(recibo.valorLiquido)}</p>
                    </div>
                  </div>
                </div>

                {/* Assinaturas (para impressão) */}
                <div className="pt-6 mt-6 border-t border-gray-200 grid grid-cols-2 gap-8 text-xs text-gray-500 print:block">
                  <div className="text-center">
                    <div className="border-t border-gray-400 pt-2 mt-8">Assinatura do Empregador</div>
                  </div>
                  <div className="text-center">
                    <div className="border-t border-gray-400 pt-2 mt-8">Assinatura do Empregado</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Formulário de edição */}
          {canEdit ? (
            <form action={atualizarFerias} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Período de Gozo
              </h2>
              <input type="hidden" name="feriasId" value={ferias.id} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Início do Gozo *</label>
                  <input type="date" name="dataInicioGozo" defaultValue={toInputDate(ferias.dataInicioGozo)} required className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Fim do Gozo *</label>
                  <input type="date" name="dataFimGozo" defaultValue={toInputDate(ferias.dataFimGozo)} required className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Dias de Abono Pecuniário (máx. 10)</label>
                  <input type="number" name="diasAbono" defaultValue={ferias.diasAbono} min="0" max="10" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <input type="checkbox" name="adiantamento13" id="adiantamento13" defaultChecked={ferias.adiantamento13} className="w-4 h-4 text-blue-600 border-gray-300 rounded" />
                  <label htmlFor="adiantamento13" className="text-sm text-gray-700">Adiantamento do 13º</label>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Observações</label>
                <textarea name="observacao" rows={2} defaultValue={ferias.observacao ?? ""} placeholder="Observações..." className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <a href="/ferias" className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 text-center transition-colors">Cancelar</a>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors font-medium">Salvar e Calcular</button>
              </div>
            </form>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-blue-600" />
                Período de Gozo
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div><p className="text-xs text-gray-500">Início do Gozo</p><p className="font-medium text-gray-900 mt-0.5">{fmtDate(ferias.dataInicioGozo)}</p></div>
                <div><p className="text-xs text-gray-500">Fim do Gozo</p><p className="font-medium text-gray-900 mt-0.5">{fmtDate(ferias.dataFimGozo)}</p></div>
                <div><p className="text-xs text-gray-500">Dias Gozados</p><p className="font-medium text-gray-900 mt-0.5">{ferias.diasGozo ?? "—"} dias</p></div>
                <div><p className="text-xs text-gray-500">Abono Pecuniário</p><p className="font-medium text-gray-900 mt-0.5">{ferias.diasAbono} dias</p></div>
                <div><p className="text-xs text-gray-500">Adiantamento 13º</p><p className="font-medium text-gray-900 mt-0.5">{ferias.adiantamento13 ? "Sim" : "Não"}</p></div>
              </div>
              {ferias.observacao && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">Observações</p>
                  <p className="text-sm text-gray-700 mt-0.5">{ferias.observacao}</p>
                </div>
              )}
            </div>
          )}

          {canEdit && (
            <form action={cancelarFerias}>
              <input type="hidden" name="feriasId" value={ferias.id} />
              <button type="submit" className="w-full px-4 py-2.5 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors">
                Cancelar Férias
              </button>
            </form>
          )}

        </div>
      </div>
    </>
  );
}
