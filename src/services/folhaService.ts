// ─── Serviço de Folha de Pagamento ───────────────────────────────────────────
// Orquestra o cálculo completo seguindo CLT e legislação tributária vigente

import { calcularINSS, calcularIRRF, calcularFGTS, calcularFerias, calcularMultaFGTS } from "@/lib/calculos";

export interface ParametrosFolha {
  competencia: string;
  funcionarios: Array<{
    id: string;
    nome: string;
    salario: number;
    categoria: string;
    dependentes: number;
    horasExtras50?: number;
    horasExtras100?: number;
    adicionalNoturno?: number;
    faltas?: number;
    outrosProventos?: Array<{ descricao: string; valor: number }>;
    outrosDescontos?: Array<{ descricao: string; valor: number }>;
  }>;
  empresa: {
    aliquotaRAT: number;
    recolheINSSPatronal: boolean;
    regime: string;
  };
  tabelaINSS: { faixas: Array<{ de: number; ate: number; aliquota: number }> };
  tabelaIRRF: { faixas: Array<{ de: number; ate: number; aliquota: number; deducao: number }>; deducaoPorDependente: number };
}

export interface ResultadoFuncionario {
  funcionarioId: string;
  nome: string;
  salarioBruto: number;
  proventos: Array<{ descricao: string; valor: number; tipo: string }>;
  descontos: Array<{ descricao: string; valor: number; tipo: string }>;
  totalProventos: number;
  totalDescontos: number;
  salarioLiquido: number;
  inssEmpregado: number;
  irrf: number;
  fgts: number;
  baseINSS: number;
  baseFGTS: number;
  baseIRRF: number;
}

export function calcularFolhaCompleta(params: ParametrosFolha): {
  funcionarios: ResultadoFuncionario[];
  totais: {
    proventos: number;
    descontos: number;
    liquido: number;
    inssEmpregado: number;
    inssPatronal: number;
    fgts: number;
    irrf: number;
  };
} {
  const resultados: ResultadoFuncionario[] = [];
  let totalProventosGeral = 0;
  let totalDescontosGeral = 0;
  let totalINSSEmpregadoGeral = 0;
  let totalINSSPatronalGeral = 0;
  let totalFGTSGeral = 0;
  let totalIRRFGeral = 0;

  for (const func of params.funcionarios) {
    const salarioDia = func.salario / 30;
    const salarioHora = func.salario / 220;

    const proventos: Array<{ descricao: string; valor: number; tipo: string }> = [];
    const descontos: Array<{ descricao: string; valor: number; tipo: string }> = [];

    // Salário base
    proventos.push({ descricao: "Salário Base", valor: func.salario, tipo: "salario" });

    // Horas extras 50%
    if (func.horasExtras50 && func.horasExtras50 > 0) {
      const valor = salarioHora * 1.5 * func.horasExtras50;
      proventos.push({ descricao: `Hora Extra 50% (${func.horasExtras50}h)`, valor, tipo: "hora_extra" });
    }

    // Horas extras 100%
    if (func.horasExtras100 && func.horasExtras100 > 0) {
      const valor = salarioHora * 2 * func.horasExtras100;
      proventos.push({ descricao: `Hora Extra 100% (${func.horasExtras100}h)`, valor, tipo: "hora_extra" });
    }

    // Outros proventos
    if (func.outrosProventos) {
      for (const p of func.outrosProventos) {
        proventos.push({ descricao: p.descricao, valor: p.valor, tipo: "outros" });
      }
    }

    // Desconto de faltas
    if (func.faltas && func.faltas > 0) {
      const valor = salarioDia * func.faltas;
      descontos.push({ descricao: `Falta(s) (${func.faltas}d)`, valor, tipo: "falta" });
    }

    const totalProventos = proventos.reduce((s, p) => s + p.valor, 0);

    // INSS
    const resultINSS = calcularINSS(totalProventos, params.tabelaINSS.faixas);
    descontos.push({ descricao: `INSS ${resultINSS.aliquotaEfetiva}% ef.`, valor: resultINSS.valorDesconto, tipo: "inss" });

    // IRRF
    const resultIRRF = calcularIRRF({
      salarioBruto: totalProventos,
      inssDescontado: resultINSS.valorDesconto,
      numeroDependentes: func.dependentes,
      faixas: params.tabelaIRRF.faixas,
    });
    if (resultIRRF.valorDesconto > 0) {
      descontos.push({ descricao: `IRRF ${resultIRRF.aliquota}%`, valor: resultIRRF.valorDesconto, tipo: "irrf" });
    }

    // Outros descontos
    if (func.outrosDescontos) {
      for (const d of func.outrosDescontos) {
        descontos.push({ descricao: d.descricao, valor: d.valor, tipo: "outros" });
      }
    }

    const totalDescontos = descontos.reduce((s, d) => s + d.valor, 0);
    const fgts = calcularFGTS(totalProventos);

    // Patronal
    if (params.empresa.recolheINSSPatronal) {
      totalINSSPatronalGeral += totalProventos * (0.20 + params.empresa.aliquotaRAT / 100);
    }

    const resultado: ResultadoFuncionario = {
      funcionarioId: func.id,
      nome: func.nome,
      salarioBruto: totalProventos,
      proventos,
      descontos,
      totalProventos,
      totalDescontos,
      salarioLiquido: parseFloat((totalProventos - totalDescontos).toFixed(2)),
      inssEmpregado: resultINSS.valorDesconto,
      irrf: resultIRRF.valorDesconto,
      fgts,
      baseINSS: resultINSS.baseCalculo,
      baseFGTS: totalProventos,
      baseIRRF: resultIRRF.baseAjustada,
    };

    resultados.push(resultado);
    totalProventosGeral += totalProventos;
    totalDescontosGeral += totalDescontos;
    totalINSSEmpregadoGeral += resultINSS.valorDesconto;
    totalFGTSGeral += fgts;
    totalIRRFGeral += resultIRRF.valorDesconto;
  }

  return {
    funcionarios: resultados,
    totais: {
      proventos: parseFloat(totalProventosGeral.toFixed(2)),
      descontos: parseFloat(totalDescontosGeral.toFixed(2)),
      liquido: parseFloat((totalProventosGeral - totalDescontosGeral).toFixed(2)),
      inssEmpregado: parseFloat(totalINSSEmpregadoGeral.toFixed(2)),
      inssPatronal: parseFloat(totalINSSPatronalGeral.toFixed(2)),
      fgts: parseFloat(totalFGTSGeral.toFixed(2)),
      irrf: parseFloat(totalIRRFGeral.toFixed(2)),
    },
  };
}
