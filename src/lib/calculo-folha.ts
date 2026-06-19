// Motor de cálculo da folha de pagamento — tabelas 2026

const FAIXAS_INSS = [
  { ate: 1518.00, aliquota: 0.075 },
  { ate: 2793.88, aliquota: 0.09 },
  { ate: 4190.83, aliquota: 0.12 },
  { ate: 8157.41, aliquota: 0.14 },
] as const;

const FAIXAS_IRRF = [
  { ate: 2259.20, aliquota: 0,     deducao: 0 },
  { ate: 2826.65, aliquota: 0.075, deducao: 169.44 },
  { ate: 3751.05, aliquota: 0.15,  deducao: 381.44 },
  { ate: 4664.68, aliquota: 0.225, deducao: 662.77 },
  { ate: Infinity, aliquota: 0.275, deducao: 896.00 },
] as const;

const DEDUCAO_DEPENDENTE = 189.59;
const ISENCAO_IRRF_2026 = 5000.00;
const TETO_INSS = 8157.41;

export function calcularINSS(salarioBruto: number): number {
  const base = Math.min(salarioBruto, TETO_INSS);
  let total = 0;
  let prev = 0;
  for (const faixa of FAIXAS_INSS) {
    if (base <= prev) break;
    total += (Math.min(base, faixa.ate) - prev) * faixa.aliquota;
    prev = faixa.ate;
  }
  return arredondar(total);
}

export function calcularIRRF(baseCalculo: number, numDependentes = 0): number {
  const bc = Math.max(0, baseCalculo - numDependentes * DEDUCAO_DEPENDENTE);
  // Isenção 2026 (Lei 15.270/2025) — rendimentos até R$ 5.000
  if (bc <= ISENCAO_IRRF_2026) return 0;
  for (let i = FAIXAS_IRRF.length - 1; i >= 0; i--) {
    const limite = i === 0 ? 0 : FAIXAS_IRRF[i - 1].ate;
    if (bc > limite) {
      return arredondar(Math.max(0, bc * FAIXAS_IRRF[i].aliquota - FAIXAS_IRRF[i].deducao));
    }
  }
  return 0;
}

export function calcularFGTS(salarioBruto: number): number {
  return arredondar(salarioBruto * 0.08);
}

export function calcularINSSPatronal(salarioBruto: number, aliquotaRAT = 1.0): number {
  // 20% cota patronal + RAT (simplificado)
  return arredondar(salarioBruto * (0.20 + aliquotaRAT / 100));
}

// ─── Cálculo de rescisão ──────────────────────────────────────────────────────

export interface ResultadoRescisao {
  saldoSalario: number;
  indenAviso: number;
  feriasVencidas: number;
  feriasPropor: number;
  decimo13: number;
  multaFGTS: number;
  totalBruto: number;
  inssRescisao: number;
  irrfRescisao: number;
  totalDescontos: number;
  totalLiquido: number;
  fgtsADepositar: number;
  diasAviso: number;
  meses13: number;
  mesesFeriasAquisitivos: number;
  mesesTotal: number;
  anos: number;
}

export function calcularRescisao(params: {
  salario: number;
  dataAdmissao: Date;
  dataDemissao: Date;
  tipoRescisao: string;
  numDependentes?: number;
}): ResultadoRescisao {
  const { salario, dataAdmissao, dataDemissao, tipoRescisao, numDependentes = 0 } = params;

  const mesesTotal = Math.max(
    0,
    Math.floor((dataDemissao.getTime() - dataAdmissao.getTime()) / (30.44 * 24 * 60 * 60 * 1000)),
  );
  const anos = Math.floor(mesesTotal / 12);
  const diasTrabalhados = dataDemissao.getDate();
  const meses13 = dataDemissao.getMonth() + 1;

  // Período aquisitivo de férias
  const aniversario = new Date(dataAdmissao);
  aniversario.setFullYear(dataDemissao.getFullYear());
  if (aniversario > dataDemissao) aniversario.setFullYear(dataDemissao.getFullYear() - 1);
  const mesesFeriasAquisitivos = Math.max(
    0,
    Math.floor((dataDemissao.getTime() - aniversario.getTime()) / (30.44 * 24 * 60 * 60 * 1000)),
  );

  const diasAviso = Math.min(90, 30 + 3 * Math.min(anos, 20));

  // Verbas
  const saldoSalario = arredondar((salario / 30) * diasTrabalhados);
  const decimo13 = arredondar((salario / 12) * meses13);
  const feriasPropor = arredondar((salario / 12) * mesesFeriasAquisitivos * (4 / 3));
  const fgtsEstimado = arredondar(salario * 0.08 * mesesTotal);

  let indenAviso = 0;
  let multaFGTS = 0;
  let feriasVencidas = 0;

  if (tipoRescisao === "DEMISSAO_SEM_JUSTA_CAUSA" || tipoRescisao === "RESCISAO_INDIRETA") {
    indenAviso = arredondar((salario / 30) * diasAviso);
    multaFGTS = arredondar(fgtsEstimado * 0.40);
    if (mesesTotal >= 24) feriasVencidas = arredondar(salario * (4 / 3));
  } else if (tipoRescisao === "ACORDO_MUTUAL") {
    indenAviso = arredondar((salario / 30) * diasAviso * 0.5);
    multaFGTS = arredondar(fgtsEstimado * 0.20);
  }
  // PEDIDO_DEMISSAO, DEMISSAO_COM_JUSTA_CAUSA: sem aviso indenizado, sem multa

  const totalBruto = saldoSalario + indenAviso + feriasVencidas + feriasPropor + decimo13 + multaFGTS;

  // INSS incide sobre saldo de salário + 13º (não férias, não multa)
  const inssRescisao = calcularINSS(saldoSalario + decimo13);

  // IRRF base = saldo + 13 + aviso - INSS (férias e multa FGTS são isentos)
  const baseIRRF = Math.max(0, saldoSalario + decimo13 + indenAviso - inssRescisao);
  const irrfRescisao = calcularIRRF(baseIRRF, numDependentes);

  const totalDescontos = inssRescisao + irrfRescisao;
  const totalLiquido = totalBruto - totalDescontos;
  const fgtsADepositar = fgtsEstimado + multaFGTS;

  return {
    saldoSalario,
    indenAviso,
    feriasVencidas,
    feriasPropor,
    decimo13,
    multaFGTS,
    totalBruto,
    inssRescisao,
    irrfRescisao,
    totalDescontos,
    totalLiquido,
    fgtsADepositar,
    diasAviso,
    meses13,
    mesesFeriasAquisitivos,
    mesesTotal,
    anos,
  };
}

function arredondar(v: number): number {
  return Math.round(v * 100) / 100;
}
