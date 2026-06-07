import { NextResponse } from "next/server";
import { PrismaClient, TipoRubrica } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (token !== "init-dpmasterpro-2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const existing = await prisma.escritorio.findFirst();
    if (existing) {
      return NextResponse.json({ message: "Seed já executado anteriormente.", escritorio: existing.nome });
    }

    const escritorio = await prisma.escritorio.create({
      data: {
        nome: "Escritório Contábil Exemplo",
        cnpj: "00.000.000/0001-00",
        email: "contato@escritorioexemplo.com.br",
        telefone: "(11) 3000-0000",
        plano: "PROFISSIONAL",
      },
    });

    await prisma.usuario.create({
      data: {
        escritorioId: escritorio.id,
        nome: "Administrador",
        email: "admin@escritorioexemplo.com.br",
        senha: await bcrypt.hash("Admin@2026", 12),
        perfil: "ADMIN",
      },
    });

    await prisma.tabelaINSS.create({
      data: {
        ano: 2026,
        vigencia: new Date("2026-01-01"),
        faixas: [
          { de: 0, ate: 1518.00, aliquota: 7.5 },
          { de: 1518.01, ate: 2793.88, aliquota: 9.0 },
          { de: 2793.89, ate: 4190.83, aliquota: 12.0 },
          { de: 4190.84, ate: 8157.41, aliquota: 14.0 },
        ],
        tetoContribuicao: 8157.41,
        salarioMinimo: 1621.00,
        ativa: true,
      },
    });

    await prisma.tabelaIRRF.create({
      data: {
        ano: 2026,
        vigencia: new Date("2026-01-01"),
        faixas: [
          { de: 0, ate: 2259.20, aliquota: 0, deducao: 0 },
          { de: 2259.21, ate: 2826.65, aliquota: 7.5, deducao: 169.44 },
          { de: 2826.66, ate: 3751.05, aliquota: 15, deducao: 381.44 },
          { de: 3751.06, ate: 4664.68, aliquota: 22.5, deducao: 662.77 },
          { de: 4664.69, ate: 99999999, aliquota: 27.5, deducao: 896.00 },
        ],
        deducaoPorDependente: 189.59,
        deducaoSimplificada: 564.80,
        limiteIsencao: 5000.00,
        usaRedutorAdicional: true,
        redutorAdicional: [{ de: 5000.01, ate: 7350.00, tipo: "proporcional" }],
        ativa: true,
      },
    });

    await prisma.tabelaFGTS.create({
      data: { ano: 2026, aliquota: 8.0, aliquotaJovemAprendiz: 2.0, vigencia: new Date("2026-01-01"), ativa: true },
    });

    await prisma.tabelaSalarioMinimo.create({
      data: { ano: 2026, valor: 1621.00, vigencia: new Date("2026-01-01"), ativa: true },
    });

    const rubricas = [
      { codigo: "0001", descricao: "Salário Base",                  tipo: TipoRubrica.PROVENTO,    naturezaESocial: "1000", incideINSS: true,  incideFGTS: true,  incideIRRF: true,  incide13: true,  incideFerias: true,  incideRescisao: true  },
      { codigo: "0002", descricao: "Salário Proporcional",          tipo: TipoRubrica.PROVENTO,    naturezaESocial: "1000", incideINSS: true,  incideFGTS: true,  incideIRRF: true,  incide13: true,  incideFerias: true,  incideRescisao: true  },
      { codigo: "0010", descricao: "Hora Extra 50%",                tipo: TipoRubrica.PROVENTO,    naturezaESocial: "1011", incideINSS: true,  incideFGTS: true,  incideIRRF: true,  incide13: true,  incideFerias: true,  incideRescisao: false },
      { codigo: "0011", descricao: "Hora Extra 100%",               tipo: TipoRubrica.PROVENTO,    naturezaESocial: "1012", incideINSS: true,  incideFGTS: true,  incideIRRF: true,  incide13: true,  incideFerias: true,  incideRescisao: false },
      { codigo: "0020", descricao: "Adicional Noturno",             tipo: TipoRubrica.PROVENTO,    naturezaESocial: "1010", incideINSS: true,  incideFGTS: true,  incideIRRF: true,  incide13: true,  incideFerias: true,  incideRescisao: false },
      { codigo: "0030", descricao: "Adicional Insalubridade",       tipo: TipoRubrica.PROVENTO,    naturezaESocial: "1010", incideINSS: true,  incideFGTS: true,  incideIRRF: true,  incide13: true,  incideFerias: true,  incideRescisao: false },
      { codigo: "0031", descricao: "Adicional Periculosidade",      tipo: TipoRubrica.PROVENTO,    naturezaESocial: "1010", incideINSS: true,  incideFGTS: true,  incideIRRF: true,  incide13: true,  incideFerias: true,  incideRescisao: false },
      { codigo: "0040", descricao: "Comissões",                     tipo: TipoRubrica.PROVENTO,    naturezaESocial: "1040", incideINSS: true,  incideFGTS: true,  incideIRRF: true,  incide13: true,  incideFerias: true,  incideRescisao: false },
      { codigo: "0050", descricao: "Adiantamento Salarial",         tipo: TipoRubrica.PROVENTO,    naturezaESocial: "1799", incideINSS: false, incideFGTS: false, incideIRRF: false, incide13: false, incideFerias: false, incideRescisao: false },
      { codigo: "0060", descricao: "PLR",                           tipo: TipoRubrica.PROVENTO,    naturezaESocial: "1600", incideINSS: false, incideFGTS: false, incideIRRF: true,  incide13: false, incideFerias: false, incideRescisao: false },
      { codigo: "0200", descricao: "Férias — Gozo",                 tipo: TipoRubrica.PROVENTO,    naturezaESocial: "1200", incideINSS: true,  incideFGTS: false, incideIRRF: true,  incide13: false, incideFerias: false, incideRescisao: false },
      { codigo: "0201", descricao: "1/3 Constitucional Férias",     tipo: TipoRubrica.PROVENTO,    naturezaESocial: "1210", incideINSS: true,  incideFGTS: false, incideIRRF: true,  incide13: false, incideFerias: false, incideRescisao: false },
      { codigo: "0202", descricao: "Abono Pecuniário",              tipo: TipoRubrica.PROVENTO,    naturezaESocial: "1220", incideINSS: false, incideFGTS: false, incideIRRF: false, incide13: false, incideFerias: false, incideRescisao: false },
      { codigo: "0300", descricao: "13º Salário 1ª Parcela",        tipo: TipoRubrica.PROVENTO,    naturezaESocial: "1100", incideINSS: false, incideFGTS: true,  incideIRRF: false, incide13: false, incideFerias: false, incideRescisao: false },
      { codigo: "0301", descricao: "13º Salário 2ª Parcela",        tipo: TipoRubrica.PROVENTO,    naturezaESocial: "1110", incideINSS: true,  incideFGTS: true,  incideIRRF: true,  incide13: false, incideFerias: false, incideRescisao: false },
      { codigo: "1000", descricao: "INSS — Empregado",              tipo: TipoRubrica.DESCONTO,    naturezaESocial: "3000", incideINSS: false, incideFGTS: false, incideIRRF: false, incide13: false, incideFerias: false, incideRescisao: false },
      { codigo: "1001", descricao: "IRRF",                          tipo: TipoRubrica.DESCONTO,    naturezaESocial: "3500", incideINSS: false, incideFGTS: false, incideIRRF: false, incide13: false, incideFerias: false, incideRescisao: false },
      { codigo: "1010", descricao: "Desconto Vale-Transporte",      tipo: TipoRubrica.DESCONTO,    naturezaESocial: "4000", incideINSS: false, incideFGTS: false, incideIRRF: false, incide13: false, incideFerias: false, incideRescisao: false },
      { codigo: "1020", descricao: "Desconto Plano de Saúde",       tipo: TipoRubrica.DESCONTO,    naturezaESocial: "4010", incideINSS: false, incideFGTS: false, incideIRRF: false, incide13: false, incideFerias: false, incideRescisao: false },
      { codigo: "1030", descricao: "Desconto Falta",                tipo: TipoRubrica.DESCONTO,    naturezaESocial: "4099", incideINSS: false, incideFGTS: false, incideIRRF: false, incide13: false, incideFerias: false, incideRescisao: false },
      { codigo: "1040", descricao: "Pensão Alimentícia",            tipo: TipoRubrica.DESCONTO,    naturezaESocial: "4099", incideINSS: false, incideFGTS: false, incideIRRF: false, incide13: false, incideFerias: false, incideRescisao: false },
      { codigo: "1050", descricao: "Adiantamento Salarial (desc.)", tipo: TipoRubrica.DESCONTO,    naturezaESocial: "4050", incideINSS: false, incideFGTS: false, incideIRRF: false, incide13: false, incideFerias: false, incideRescisao: false },
      { codigo: "9001", descricao: "FGTS — Depósito Mensal",        tipo: TipoRubrica.INFORMATIVO, naturezaESocial: "9001", incideINSS: false, incideFGTS: false, incideIRRF: false, incide13: false, incideFerias: false, incideRescisao: false },
      { codigo: "9010", descricao: "Vale-Alimentação (PAT)",         tipo: TipoRubrica.INFORMATIVO, naturezaESocial: "1811", incideINSS: false, incideFGTS: false, incideIRRF: false, incide13: false, incideFerias: false, incideRescisao: false },
      { codigo: "9020", descricao: "Vale-Transporte Bruto",          tipo: TipoRubrica.INFORMATIVO, naturezaESocial: "1812", incideINSS: false, incideFGTS: false, incideIRRF: false, incide13: false, incideFerias: false, incideRescisao: false },
    ];

    for (const r of rubricas) {
      await prisma.rubrica.create({ data: { ...r, global: true } });
    }

    return NextResponse.json({ success: true, message: "Seed executado com sucesso!", login: "admin@escritorioexemplo.com.br", senha: "Admin@2026" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
