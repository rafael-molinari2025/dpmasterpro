// ─── Gerador de XML eSocial S-1.3 ────────────────────────────────────────────

export interface EmpresaESocial {
  cnpj: string;
  razaoSocial: string;
  ambiente: "1" | "2"; // 1=Prod, 2=Homol
}

export type EventoTipo =
  | "S-1000" | "S-1005" | "S-1010" | "S-1020" | "S-1070"
  | "S-1200" | "S-1210" | "S-1280" | "S-1299"
  | "S-2200" | "S-2205" | "S-2206" | "S-2210" | "S-2220"
  | "S-2230" | "S-2240" | "S-2299" | "S-2300" | "S-2399"
  | "S-2400" | "S-2500" | "S-3000";

export const DESCRICAO_EVENTOS: Record<EventoTipo, string> = {
  "S-1000": "Informações do Empregador/Contribuinte/Órgão Público",
  "S-1005": "Tabela de Estabelecimentos, Obras ou Unidades de Órgãos Públicos",
  "S-1010": "Tabela de Rubricas",
  "S-1020": "Tabela de Lotações Tributárias",
  "S-1070": "Tabela de Processos Administrativos/Judiciais",
  "S-1200": "Remuneração de Trabalhador Vinculado ao RGPS",
  "S-1210": "Pagamentos de Rendimentos do Trabalho",
  "S-1280": "Informações Complementares aos Eventos Periódicos",
  "S-1299": "Fechamento dos Eventos Periódicos",
  "S-2200": "Cadastramento Inicial do Vínculo e Admissão/Ingresso de Trabalhador",
  "S-2205": "Alteração de Dados Cadastrais do Trabalhador",
  "S-2206": "Alteração de Contrato de Trabalho",
  "S-2210": "Comunicação de Acidente de Trabalho",
  "S-2220": "Monitoramento da Saúde do Trabalhador",
  "S-2230": "Afastamento Temporário",
  "S-2240": "Condições Ambientais do Trabalho",
  "S-2299": "Desligamento",
  "S-2300": "Trabalhador Sem Vínculo de Emprego/Estatutário - Início",
  "S-2399": "Trabalhador Sem Vínculo de Emprego/Estatutário - Término",
  "S-2400": "Cadastro de Benefícios Previdenciários",
  "S-2500": "Processo Trabalhista",
  "S-3000": "Exclusão de Eventos",
};

// Tabela 03 eSocial - Naturezas de Rubrica (atualizada 2026 S-1.3)
export const TABELA_03_ESOCIAL = [
  { codigo: "1000", descricao: "Remuneração básica - Salário, vencimento, soldo" },
  { codigo: "1010", descricao: "Adicionais legais - hora extra, noturno, insalubridade, periculosidade" },
  { codigo: "1011", descricao: "Hora extra - até 50%" },
  { codigo: "1012", descricao: "Hora extra - acima de 50%" },
  { codigo: "1020", descricao: "Adicionais convencionais" },
  { codigo: "1040", descricao: "Comissões, percentagens, gorjetas" },
  { codigo: "1050", descricao: "Alimentação fornecida pelo empregador" },
  { codigo: "1060", descricao: "Habitação fornecida pelo empregador" },
  { codigo: "1070", descricao: "Veículo fornecido pelo empregador" },
  { codigo: "1080", descricao: "Diárias" },
  { codigo: "1100", descricao: "13º Salário - 1ª parcela" },
  { codigo: "1110", descricao: "13º Salário - 2ª parcela" },
  { codigo: "1200", descricao: "Férias - gozo" },
  { codigo: "1210", descricao: "1/3 constitucional de férias" },
  { codigo: "1220", descricao: "Abono pecuniário de férias" },
  { codigo: "1230", descricao: "1/3 sobre abono pecuniário" },
  { codigo: "1300", descricao: "Verbas indenizatórias - aviso prévio indenizado" },
  { codigo: "1310", descricao: "Verbas indenizatórias - férias proporcionais na rescisão" },
  { codigo: "1320", descricao: "Verbas indenizatórias - 13º na rescisão" },
  { codigo: "1330", descricao: "Verbas indenizatórias - saldo de salário" },
  { codigo: "1350", descricao: "Indenização rescisória" },
  { codigo: "1600", descricao: "PLR - Participação nos lucros e resultados" },
  { codigo: "1650", descricao: "Abono único" },
  { codigo: "1799", descricao: "Outras remunerações tributáveis" },
  { codigo: "1800", descricao: "Reembolso creche/babá" },
  { codigo: "1811", descricao: "Vale-alimentação - PAT" },
  { codigo: "1812", descricao: "Vale-transporte" },
  { codigo: "1900", descricao: "Outros valores não tributáveis" },
  { codigo: "3000", descricao: "Desconto de INSS" },
  { codigo: "3500", descricao: "Desconto de IRRF" },
  { codigo: "4000", descricao: "Desconto de vale-transporte" },
  { codigo: "4010", descricao: "Desconto de plano de saúde" },
  { codigo: "4020", descricao: "Desconto de vale-refeição" },
  { codigo: "4050", descricao: "Desconto de adiantamento de salário" },
  { codigo: "4099", descricao: "Outros descontos" },
  { codigo: "5001", descricao: "Base de cálculo INSS" },
  { codigo: "5002", descricao: "Base de cálculo FGTS" },
  { codigo: "5003", descricao: "Base de cálculo IRRF" },
  { codigo: "9000", descricao: "Informativo - não integra remuneração" },
  { codigo: "9001", descricao: "FGTS depositado" },
  { codigo: "9002", descricao: "FGTS sobre verbas rescisórias" },
  { codigo: "1099", descricao: "Outras remunerações tributáveis não especificadas" },
];

function gerarNumeroEvento(): string {
  return `EV${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

function headerEvento(empresa: EmpresaESocial, tipoEvento: string, nrRecibo?: string) {
  return {
    ideEmpregador: {
      tpInsc: "1",
      nrInsc: empresa.cnpj.replace(/\D/g, "").substring(0, 8),
    },
    ideTransmissor: {
      tpInsc: "1",
      nrInsc: empresa.cnpj.replace(/\D/g, ""),
    },
  };
}

// S-1010 — Tabela de Rubricas
export function gerarS1010(empresa: EmpresaESocial, rubricas: Array<{
  codigo: string;
  descricao: string;
  natureza: string;
  tipo: string;
  incideINSS: boolean;
  incideFGTS: boolean;
  incideIRRF: boolean;
}>) {
  const timestamp = new Date().toISOString();
  return {
    eSocial: {
      "@xmlns": "http://www.esocial.gov.br/schema/evt/evtTabRubrica/v04_00_01",
      evtTabRubrica: {
        "@Id": gerarNumeroEvento(),
        ideEvento: {
          tpAmb: empresa.ambiente,
          procEmi: "1",
          verProc: "S-1.3",
        },
        ideEmpregador: {
          tpInsc: "1",
          nrInsc: empresa.cnpj.replace(/\D/g, "").substring(0, 8),
        },
        tabRubrica: {
          ideRubrica: rubricas.map((r) => ({
            codRubr: r.codigo,
            ideTabRubr: "1",
            dtIniValid: "2020-01",
            rubrica: {
              dscRubr: r.descricao,
              natRubr: r.natureza,
              tpRubr: r.tipo === "PROVENTO" ? "1" : r.tipo === "DESCONTO" ? "2" : r.tipo === "INFORMATIVO" ? "3" : "4",
              codIncCP: r.incideINSS ? "1" : "0",
              codIncFGTS: r.incideFGTS ? "1" : "0",
              codIncIRRF: r.incideIRRF ? "1" : "0",
            },
          })),
        },
      },
    },
  };
}

// S-1200 — Remuneração do Trabalhador
export function gerarS1200(empresa: EmpresaESocial, params: {
  competencia: string;
  funcionario: { cpf: string; matricula: string; categoria: string };
  remuneracao: { totalBruto: number; baseINSS: number; baseFGTS: number; baseIRRF: number };
  itens: Array<{ codigoRubrica: string; tipo: string; valor: number; baseINSS?: number; baseFGTS?: number; baseIRRF?: number }>;
}) {
  return {
    eSocial: {
      "@xmlns": "http://www.esocial.gov.br/schema/evt/evtRemun/v04_00_01",
      evtRemun: {
        "@Id": gerarNumeroEvento(),
        ideEvento: {
          indRetif: "1",
          nrRecibo: "",
          indApuracao: "1",
          perApur: params.competencia,
          tpAmb: empresa.ambiente,
          procEmi: "1",
          verProc: "S-1.3",
        },
        ideEmpregador: {
          tpInsc: "1",
          nrInsc: empresa.cnpj.replace(/\D/g, "").substring(0, 8),
        },
        ideTrabalhador: {
          cpfTrab: params.funcionario.cpf.replace(/\D/g, ""),
        },
        dmDev: {
          ideDmDev: `${empresa.cnpj.replace(/\D/g, "")}-${params.funcionario.matricula}-${params.competencia}`,
          codCateg: params.funcionario.categoria,
          infoPerApur: {
            ideEstabLot: {
              tpInsc: "1",
              nrInsc: empresa.cnpj.replace(/\D/g, ""),
              codLotacao: "S",
              detVerbas: params.itens.map((item) => ({
                codRubr: item.codigoRubrica,
                ideTabRubr: "1",
                qtdRubr: item.tipo === "hora" ? undefined : undefined,
                vrRubr: item.valor.toFixed(2),
              })),
            },
          },
        },
      },
    },
  };
}

// S-2200 — Admissão
export function gerarS2200(empresa: EmpresaESocial, funcionario: {
  cpf: string;
  nome: string;
  dataNascimento: string;
  sexo: string;
  matricula: string;
  dataAdmissao: string;
  cargo: string;
  salario: number;
  categoria: string;
  jornadaHoras: number;
  ctps?: string;
  pisPasep?: string;
}) {
  return {
    eSocial: {
      "@xmlns": "http://www.esocial.gov.br/schema/evt/evtAdmissao/v03_00_00",
      evtAdmissao: {
        "@Id": gerarNumeroEvento(),
        ideEvento: {
          indRetif: "1",
          tpAmb: empresa.ambiente,
          procEmi: "1",
          verProc: "S-1.3",
        },
        ideEmpregador: {
          tpInsc: "1",
          nrInsc: empresa.cnpj.replace(/\D/g, "").substring(0, 8),
        },
        trabalhador: {
          cpfTrab: funcionario.cpf.replace(/\D/g, ""),
          nmTrab: funcionario.nome,
          sexo: funcionario.sexo,
          racaCor: "0",
          estCiv: "0",
          grauInstr: "07",
          nascimento: {
            dtNascto: funcionario.dataNascimento,
            paisNascto: "105",
            paisNac: "105",
          },
          documentos: funcionario.ctps ? {
            CTPS: {
              nrCtps: funcionario.ctps,
              ufCtps: "SP",
            }
          } : undefined,
        },
        vinculo: {
          matrícula: funcionario.matricula,
          tpRegTrab: "1",
          tpRegPrev: "1",
          dtAdm: funcionario.dataAdmissao,
          tpAdmissao: "1",
          indAdmissao: "0",
          nrProcTrab: undefined,
          cargo: {
            nmCargo: funcionario.cargo,
            CBOCargo: "141005",
          },
          remuneracao: {
            vrSalFx: funcionario.salario.toFixed(2),
            undSalFixo: "5",
          },
          jornada: {
            qtdHrsSem: funcionario.jornadaHoras / 4.33,
            tpJornada: "1",
            dscJorn: "Seg a Sex 8h-18h",
          },
          codCateg: funcionario.categoria,
        },
      },
    },
  };
}

// S-2299 — Desligamento
export function gerarS2299(empresa: EmpresaESocial, params: {
  cpf: string;
  matricula: string;
  dataDemissao: string;
  motivoDemissao: string;
  pensaoAlimenticia?: boolean;
}) {
  return {
    eSocial: {
      "@xmlns": "http://www.esocial.gov.br/schema/evt/evtDeslig/v03_00_00",
      evtDeslig: {
        "@Id": gerarNumeroEvento(),
        ideEvento: {
          indRetif: "1",
          nrRecibo: "",
          tpAmb: empresa.ambiente,
          procEmi: "1",
          verProc: "S-1.3",
        },
        ideEmpregador: {
          tpInsc: "1",
          nrInsc: empresa.cnpj.replace(/\D/g, "").substring(0, 8),
        },
        ideVinculo: {
          cpfTrab: params.cpf.replace(/\D/g, ""),
          matrícula: params.matricula,
        },
        infoDeslig: {
          dtDeslig: params.dataDemissao,
          mtvDeslig: params.motivoDemissao,
          dtProjFimAPI: undefined,
          pensAlim: params.pensaoAlimenticia ? "S" : "N",
        },
      },
    },
  };
}

// S-1299 — Fechamento de Período
export function gerarS1299(empresa: EmpresaESocial, competencia: string) {
  return {
    eSocial: {
      "@xmlns": "http://www.esocial.gov.br/schema/evt/evtFechamento/v04_00_00",
      evtFechamento: {
        "@Id": gerarNumeroEvento(),
        ideEvento: {
          indRetif: "1",
          nrRecibo: "",
          indApuracao: "1",
          perApur: competencia,
          tpAmb: empresa.ambiente,
          procEmi: "1",
          verProc: "S-1.3",
        },
        ideEmpregador: {
          tpInsc: "1",
          nrInsc: empresa.cnpj.replace(/\D/g, "").substring(0, 8),
        },
        infoFechamento: {
          situFolhaPgto: "1",
          dtIniSemVinc: undefined,
          indExistInfo: {
            indEvtAdmNR: "S",
            indEvtTabLotacao: "S",
            indEvtTabRubrica: "S",
            indEvtRemun: "S",
            indEvtPgtos: "N",
          },
        },
      },
    },
  };
}
