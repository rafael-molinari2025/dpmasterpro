// ─── Serviço de Rescisão (TRCT) ──────────────────────────────────────────────
// Cálculo completo conforme CLT Arts. 467-501

import { calcularINSS, calcularIRRF, calcularFGTS } from "@/lib/calculos";
import { differenceInMonths, differenceInDays } from "date-fns";

export type TipoRescisao =
  | "PEDIDO_DEMISSAO"
  | "DEMISSAO_SEM_JUSTA_CAUSA"
  | "DEMISSAO_COM_JUSTA_CAUSA"
  | "RESCISAO_INDIRETA"
  | "ACORDO_MUTUAL"
  | "APOSENTADORIA"
  | "FALECIMENTO"
  | "TERMINO_CONTRATO";

export interface ParametrosRescisao {
  salario: number;
  dataAdmissao: Date;
  dataDemissao: Date;
  tipoRescisao: TipoRescisao;
  avisoPrevio: "TRABALHADO" | "INDENIZADO" | "DISPENSADO";
  diasAviso: number;
  numeroDependentes: number;
  fgtsAcumulado: number;
  salarioMes?: number;        // dias trabalhados no mês
  feriasPendentes?: number;   // períodos anteriores vencidos
  adiantou13?: boolean;
}

export interface ResultadoRescisao {
  // Verbas
  saldoSalario: number;
  avisoPrevioIndenizado: number;
  feriasVencidas: number;
  feriasProporcional: number;
  tercoFerias: number;
  decimoTerceiro: number;
  multaFGTS: number;
  indenizacaoAdicional: number;

  // Descontos
  inssRescisao: number;
  irrfRescisao: number;

  // Totais
  totalBruto: number;
  totalDescontos: number;
  totalLiquido: number;
  fgtsADepositar: number;

  // Detalhes de cálculo
  diasTrabalhadosMes: number;
  mesesParaFerias: number;
  avosDecimoTerceiro: number;
  avosFerias: number;
}

export function calcularRescisao(params: ParametrosRescisao): ResultadoRescisao {
  const { salario, dataAdmissao, dataDemissao, tipoRescisao, avisoPrevio, diasAviso, numeroDependentes, fgtsAcumulado } = params;
  const salarioDia = salario / 30;

  // Dias trabalhados no mês
  const diasTrabalhadosMes = dataDemissao.getDate();

  // Saldo de salário
  const saldoSalario = parseFloat((salarioDia * diasTrabalhadosMes).toFixed(2));

  // Aviso prévio indenizado
  let avisoPrevioIndenizado = 0;
  if (
    avisoPrevio === "INDENIZADO" &&
    ["DEMISSAO_SEM_JUSTA_CAUSA", "RESCISAO_INDIRETA", "ACORDO_MUTUAL"].includes(tipoRescisao)
  ) {
    avisoPrevioIndenizado = parseFloat((salario + salarioDia * (diasAviso - 30) * 3).toFixed(2));
  }

  // Férias vencidas (períodos anteriores completos não gozados)
  const feriasVencidas = parseFloat((salario * (params.feriasPendentes ?? 0)).toFixed(2));

  // Férias proporcionais
  const totalMeses = differenceInMonths(dataDemissao, dataAdmissao);
  const mesesParaFerias = totalMeses % 12;
  const avosFerias = mesesParaFerias >= 1 ? mesesParaFerias : 0;

  let feriasProporcional = 0;
  if (!["DEMISSAO_COM_JUSTA_CAUSA"].includes(tipoRescisao)) {
    feriasProporcional = parseFloat(((salario / 12) * avosFerias).toFixed(2));
  }

  // 1/3 sobre férias (vencidas + proporcionais)
  const tercoFerias = parseFloat(((feriasVencidas + feriasProporcional) / 3).toFixed(2));

  // 13º Proporcional
  const mesAtual = dataDemissao.getMonth() + 1;
  const avosDecimoTerceiro = params.adiantou13 ? 0 : mesAtual;
  let decimoTerceiro = 0;
  if (!["DEMISSAO_COM_JUSTA_CAUSA"].includes(tipoRescisao)) {
    decimoTerceiro = parseFloat(((salario / 12) * avosDecimoTerceiro).toFixed(2));
  }

  // Multa FGTS
  const aliquotaMulta =
    tipoRescisao === "DEMISSAO_SEM_JUSTA_CAUSA" || tipoRescisao === "RESCISAO_INDIRETA" ? 0.4 :
    tipoRescisao === "ACORDO_MUTUAL" ? 0.2 : 0;
  const multaFGTS = parseFloat((fgtsAcumulado * aliquotaMulta).toFixed(2));

  // Indenização adicional (art. 9 Lei 7238/84 — quando aviso coincide com data-base)
  const indenizacaoAdicional = 0; // Calcular caso necessário

  // Total bruto rescisório
  const totalBruto = saldoSalario + avisoPrevioIndenizado + feriasVencidas +
    feriasProporcional + tercoFerias + decimoTerceiro + multaFGTS + indenizacaoAdicional;

  // INSS sobre verbas tributáveis (saldo + aviso trabalhado + 13º)
  const baseINSS = saldoSalario + decimoTerceiro;
  const resultINSS = calcularINSS(baseINSS);

  // IRRF sobre rescisão (base: verbas tributáveis - INSS)
  const baseTributavelIRRF = saldoSalario + avisoPrevioIndenizado + decimoTerceiro;
  const resultIRRF = calcularIRRF({
    salarioBruto: baseTributavelIRRF,
    inssDescontado: resultINSS.valorDesconto,
    numeroDependentes,
  });

  const totalDescontos = resultINSS.valorDesconto + resultIRRF.valorDesconto;
  const fgtsADepositar = calcularFGTS(saldoSalario + avisoPrevioIndenizado + decimoTerceiro) + multaFGTS;

  return {
    saldoSalario,
    avisoPrevioIndenizado,
    feriasVencidas,
    feriasProporcional,
    tercoFerias,
    decimoTerceiro,
    multaFGTS,
    indenizacaoAdicional,
    inssRescisao: resultINSS.valorDesconto,
    irrfRescisao: resultIRRF.valorDesconto,
    totalBruto: parseFloat(totalBruto.toFixed(2)),
    totalDescontos: parseFloat(totalDescontos.toFixed(2)),
    totalLiquido: parseFloat((totalBruto - totalDescontos).toFixed(2)),
    fgtsADepositar: parseFloat(fgtsADepositar.toFixed(2)),
    diasTrabalhadosMes,
    mesesParaFerias,
    avosDecimoTerceiro,
    avosFerias,
  };
}
