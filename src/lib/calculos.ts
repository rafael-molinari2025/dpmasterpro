// ─── Motor de Cálculo CLT ─────────────────────────────────────────────────────

export interface FaixaINSS {
  de: number;
  ate: number;
  aliquota: number;
}

export interface FaixaIRRF {
  de: number;
  ate: number;
  aliquota: number;
  deducao: number;
}

export interface ResultadoINSS {
  baseCalculo: number;
  valorDesconto: number;
  aliquotaEfetiva: number;
  detalhamento: Array<{ faixa: string; base: number; aliquota: number; valor: number }>;
}

export interface ResultadoIRRF {
  baseCalculo: number;
  deducaoDependentes: number;
  deducaoINSS: number;
  deducaoSimplificada: number;
  baseAjustada: number;
  redutorAdicional: number;
  valorDesconto: number;
  aliquota: number;
  deducaoTabela: number;
}

// Tabela INSS 2026 - Portaria Interministerial MPS/MF nº 13/2026
export const TABELA_INSS_2026: FaixaINSS[] = [
  { de: 0,        ate: 1518.00,  aliquota: 7.5  },
  { de: 1518.01,  ate: 2793.88,  aliquota: 9    },
  { de: 2793.89,  ate: 4190.83,  aliquota: 12   },
  { de: 4190.84,  ate: 8157.41,  aliquota: 14   },
];

// Tabela IRRF 2026 - Lei 15.270/2025 (Reforma)
export const TABELA_IRRF_2026: FaixaIRRF[] = [
  { de: 0,        ate: 2259.20,  aliquota: 0,   deducao: 0       },
  { de: 2259.21,  ate: 2826.65,  aliquota: 7.5, deducao: 169.44  },
  { de: 2826.66,  ate: 3751.05,  aliquota: 15,  deducao: 381.44  },
  { de: 3751.06,  ate: 4664.68,  aliquota: 22.5,deducao: 662.77  },
  { de: 4664.69,  ate: Infinity, aliquota: 27.5,deducao: 896.00  },
];

export const DEDUCAO_DEPENDENTE_2026 = 189.59;
export const LIMITE_ISENCAO_2026 = 5000.00;

// Redutor adicional 2026 (isenção gradual R$5k–R$7.350)
export const REDUTOR_ADICIONAL_2026 = [
  { de: 5000.01, ate: 7350.00, calcular: (base: number) => {
    const irSemReducao = calcularIRRFBruto(base, TABELA_IRRF_2026);
    const proporcao = (7350 - base) / 2350;
    return irSemReducao * proporcao;
  }},
];

// ─── CÁLCULO INSS PROGRESSIVO ────────────────────────────────────────────────

export function calcularINSS(salarioBruto: number, faixas: FaixaINSS[] = TABELA_INSS_2026): ResultadoINSS {
  const teto = 8157.41;
  const base = Math.min(salarioBruto, teto);
  let totalINSS = 0;
  const detalhamento = [];

  for (const faixa of faixas) {
    if (base <= faixa.de) break;
    const faixaBase = Math.min(base, faixa.ate) - faixa.de;
    const valorFaixa = faixaBase * (faixa.aliquota / 100);
    totalINSS += valorFaixa;
    detalhamento.push({
      faixa: `${faixa.de.toLocaleString("pt-BR")} – ${faixa.ate === Infinity ? "acima" : faixa.ate.toLocaleString("pt-BR")}`,
      base: faixaBase,
      aliquota: faixa.aliquota,
      valor: valorFaixa,
    });
  }

  return {
    baseCalculo: base,
    valorDesconto: parseFloat(totalINSS.toFixed(2)),
    aliquotaEfetiva: base > 0 ? parseFloat(((totalINSS / base) * 100).toFixed(2)) : 0,
    detalhamento,
  };
}

function calcularIRRFBruto(base: number, faixas: FaixaIRRF[]): number {
  for (const faixa of faixas) {
    if (base <= faixa.ate) {
      return Math.max(0, base * (faixa.aliquota / 100) - faixa.deducao);
    }
  }
  return 0;
}

// ─── CÁLCULO IRRF ────────────────────────────────────────────────────────────

export function calcularIRRF(params: {
  salarioBruto: number;
  inssDescontado: number;
  numeroDependentes: number;
  outrasDeducoes?: number;
  faixas?: FaixaIRRF[];
}): ResultadoIRRF {
  const { salarioBruto, inssDescontado, numeroDependentes, outrasDeducoes = 0, faixas = TABELA_IRRF_2026 } = params;

  const deducaoDependentes = numeroDependentes * DEDUCAO_DEPENDENTE_2026;
  const baseAjustada = Math.max(0, salarioBruto - inssDescontado - deducaoDependentes - outrasDeducoes);

  // Isenção total até R$5.000 (2026)
  if (baseAjustada <= LIMITE_ISENCAO_2026) {
    return {
      baseCalculo: salarioBruto,
      deducaoDependentes,
      deducaoINSS: inssDescontado,
      deducaoSimplificada: 0,
      baseAjustada,
      redutorAdicional: 0,
      valorDesconto: 0,
      aliquota: 0,
      deducaoTabela: 0,
    };
  }

  let irBruto = 0;
  let aliquota = 0;
  let deducaoTabela = 0;

  for (const faixa of faixas) {
    if (baseAjustada <= faixa.ate) {
      irBruto = baseAjustada * (faixa.aliquota / 100) - faixa.deducao;
      aliquota = faixa.aliquota;
      deducaoTabela = faixa.deducao;
      break;
    }
  }

  // Redutor adicional (entre R$5k e R$7.350)
  let redutorAdicional = 0;
  if (baseAjustada > 5000 && baseAjustada <= 7350) {
    const proporcao = (7350 - baseAjustada) / 2350;
    redutorAdicional = irBruto * proporcao;
  }

  const valorDesconto = Math.max(0, parseFloat((irBruto - redutorAdicional).toFixed(2)));

  return {
    baseCalculo: salarioBruto,
    deducaoDependentes,
    deducaoINSS: inssDescontado,
    deducaoSimplificada: 0,
    baseAjustada,
    redutorAdicional: parseFloat(redutorAdicional.toFixed(2)),
    valorDesconto,
    aliquota,
    deducaoTabela,
  };
}

// ─── CÁLCULO FGTS ────────────────────────────────────────────────────────────

export function calcularFGTS(salarioBruto: number, aliquota = 8): number {
  return parseFloat((salarioBruto * (aliquota / 100)).toFixed(2));
}

// ─── CÁLCULO FÉRIAS ──────────────────────────────────────────────────────────

export function calcularFerias(params: {
  salario: number;
  diasGozados: number;
  diasAbono: number;
  numeroDependentes: number;
  adiantamento13?: boolean;
}): {
  valorFerias: number;
  valorTercoConstitucional: number;
  valorAbono: number;
  valorTercoAbono: number;
  inssFerias: number;
  irrfFerias: number;
  liquido: number;
} {
  const { salario, diasGozados, diasAbono, numeroDependentes, adiantamento13 = false } = params;
  const salarioDia = salario / 30;

  const valorFerias = parseFloat((salarioDia * diasGozados).toFixed(2));
  const valorTercoConstitucional = parseFloat((valorFerias / 3).toFixed(2));
  const valorAbono = parseFloat((salarioDia * diasAbono).toFixed(2));
  const valorTercoAbono = parseFloat((valorAbono / 3).toFixed(2));

  const brutoFerias = valorFerias + valorTercoConstitucional + valorAbono + valorTercoAbono;

  const resultINSS = calcularINSS(brutoFerias);
  const inssFerias = resultINSS.valorDesconto;

  const resultIRRF = calcularIRRF({
    salarioBruto: brutoFerias,
    inssDescontado: inssFerias,
    numeroDependentes,
  });
  const irrfFerias = resultIRRF.valorDesconto;

  return {
    valorFerias,
    valorTercoConstitucional,
    valorAbono,
    valorTercoAbono,
    inssFerias,
    irrfFerias,
    liquido: parseFloat((brutoFerias - inssFerias - irrfFerias).toFixed(2)),
  };
}

// ─── CÁLCULO RESCISÃO ────────────────────────────────────────────────────────

export function calcularSaldoSalario(salario: number, diasTrabalhados: number): number {
  return parseFloat(((salario / 30) * diasTrabalhados).toFixed(2));
}

export function calcularFeriasProporcional(salario: number, mesesTrabalhados: number, avosGanhos: number): number {
  const base = (salario / 12) * avosGanhos;
  return parseFloat(base.toFixed(2));
}

export function calcularMultaFGTS(fgtsAcumulado: number, tipoRescisao: string): number {
  const semJustaCausa = ["DEMISSAO_SEM_JUSTA_CAUSA", "RESCISAO_INDIRETA", "ACORDO_MUTUAL"];
  if (semJustaCausa.includes(tipoRescisao)) {
    const aliquota = tipoRescisao === "ACORDO_MUTUAL" ? 0.2 : 0.4;
    return parseFloat((fgtsAcumulado * aliquota).toFixed(2));
  }
  return 0;
}
