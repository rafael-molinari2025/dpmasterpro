import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import { ArrowLeft, AlertCircle, Calendar, User, Building2, Clock } from "lucide-react";
import { atualizarFerias, cancelarFerias } from "./actions";

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

function fmt(v: number | null | undefined) {
  if (v == null) return "—";
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function toInputDate(d: Date | null | undefined) {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0];
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
          cargo: { select: { descricao: true } },
          setor: { select: { descricao: true } },
        },
      },
      empresa: {
        select: { razaoSocial: true, nomeFantasia: true },
      },
    },
  });

  if (!ferias) notFound();

  const canEdit = ferias.status !== "GOZADA" && ferias.status !== "CANCELADA";
  const statusInfo = STATUS_INFO[ferias.status] ?? { label: ferias.status, cls: "bg-gray-50 text-gray-700 border-gray-200" };

  return (
    <>
      <Header
        title="Detalhes das Férias"
        subtitle={ferias.funcionario.nome}
      />
      <div className="flex-1 p-3 sm:p-6">
        <div className="max-w-2xl mx-auto space-y-5">

          <a
            href="/ferias"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Férias
          </a>

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
              <div>
                <p className="text-xs text-gray-500">Funcionário</p>
                <p className="font-medium text-gray-900 mt-0.5">{ferias.funcionario.nome}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Matrícula</p>
                <p className="font-medium text-gray-900 mt-0.5">{ferias.funcionario.matricula}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Cargo / Setor</p>
                <p className="font-medium text-gray-900 mt-0.5">
                  {ferias.funcionario.cargo?.descricao ?? "—"} / {ferias.funcionario.setor?.descricao ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Empresa</p>
                <p className="font-medium text-gray-900 mt-0.5">
                  {ferias.empresa.nomeFantasia ?? ferias.empresa.razaoSocial}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Admissão</p>
                <p className="font-medium text-gray-900 mt-0.5">{fmtDate(ferias.funcionario.dataAdmissao)}</p>
              </div>
            </div>
          </div>

          {/* Período aquisitivo */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Período Aquisitivo
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500">Início Aquisitivo</p>
                <p className="font-medium text-gray-900 mt-0.5">{fmtDate(ferias.dataInicioAquisitivo)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Fim Aquisitivo</p>
                <p className="font-medium text-gray-900 mt-0.5">{fmtDate(ferias.dataFimAquisitivo)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Dias de Direito</p>
                <p className="font-medium text-gray-900 mt-0.5">{ferias.diasDireito} dias</p>
              </div>
            </div>
          </div>

          {/* Valores calculados */}
          {(ferias.valorFerias != null || ferias.valorLiquido != null) && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <h2 className="font-semibold text-gray-900">Valores</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Férias</p>
                  <p className="font-medium text-gray-900 mt-0.5">R$ {fmt(Number(ferias.valorFerias))}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Abono (1/3)</p>
                  <p className="font-medium text-gray-900 mt-0.5">R$ {fmt(Number(ferias.valorTerceiro))}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">INSS</p>
                  <p className="font-medium text-gray-900 mt-0.5">R$ {fmt(Number(ferias.valorINSS))}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">IRRF</p>
                  <p className="font-medium text-gray-900 mt-0.5">R$ {fmt(Number(ferias.valorIRRF))}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Abono Pecuniário</p>
                  <p className="font-medium text-gray-900 mt-0.5">R$ {fmt(Number(ferias.valorAbono))}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold">Líquido</p>
                  <p className="font-bold text-green-700 text-lg mt-0.5">R$ {fmt(Number(ferias.valorLiquido))}</p>
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
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Início do Gozo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="dataInicioGozo"
                    defaultValue={toInputDate(ferias.dataInicioGozo)}
                    required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Fim do Gozo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="dataFimGozo"
                    defaultValue={toInputDate(ferias.dataFimGozo)}
                    required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Dias de Abono Pecuniário (máx. 10)
                  </label>
                  <input
                    type="number"
                    name="diasAbono"
                    defaultValue={ferias.diasAbono}
                    min="0"
                    max="10"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <input
                    type="checkbox"
                    name="adiantamento13"
                    id="adiantamento13"
                    defaultChecked={ferias.adiantamento13}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label htmlFor="adiantamento13" className="text-sm text-gray-700">
                    Adiantamento do 13º
                  </label>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Observações</label>
                <textarea
                  name="observacao"
                  rows={2}
                  defaultValue={ferias.observacao ?? ""}
                  placeholder="Observações sobre as férias..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <a
                  href="/ferias"
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 text-center transition-colors"
                >
                  Cancelar
                </a>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors font-medium"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-blue-600" />
                Período de Gozo
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Início do Gozo</p>
                  <p className="font-medium text-gray-900 mt-0.5">{fmtDate(ferias.dataInicioGozo)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Fim do Gozo</p>
                  <p className="font-medium text-gray-900 mt-0.5">{fmtDate(ferias.dataFimGozo)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Dias Gozados</p>
                  <p className="font-medium text-gray-900 mt-0.5">{ferias.diasGozo ?? "—"} dias</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Abono Pecuniário</p>
                  <p className="font-medium text-gray-900 mt-0.5">{ferias.diasAbono} dias</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Adiantamento 13º</p>
                  <p className="font-medium text-gray-900 mt-0.5">{ferias.adiantamento13 ? "Sim" : "Não"}</p>
                </div>
              </div>
              {ferias.observacao && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">Observações</p>
                  <p className="text-sm text-gray-700 mt-0.5">{ferias.observacao}</p>
                </div>
              )}
            </div>
          )}

          {/* Cancelar férias */}
          {canEdit && (
            <form action={cancelarFerias}>
              <input type="hidden" name="feriasId" value={ferias.id} />
              <button
                type="submit"
                className="w-full px-4 py-2.5 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors"
              >
                Cancelar Férias
              </button>
            </form>
          )}

        </div>
      </div>
    </>
  );
}
