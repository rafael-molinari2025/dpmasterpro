import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { registrarLog } from "@/lib/logger";

export async function GET() {
  const guard = await requireAuth();
  if (!guard.ok) return guard.response;
  const { escritorioId } = guard.session;

  try {
    const rows = await db.empresa.findMany({
      where: { escritorioId },
      select: {
        id: true,
        escritorioId: true,
        razaoSocial: true,
        nomeFantasia: true,
        cnpj: true,
        inscEstadual: true,
        inscMunicipal: true,
        cnae: true,
        naturezaJuridica: true,
        regimeTributario: true,
        recolheINSSPatronal: true,
        aliquotaRAT: true,
        fatorMEI: true,
        responsavelNome: true,
        responsavelCPF: true,
        email: true,
        telefone: true,
        endereco: true,
        ativa: true,
        createdAt: true,
        updatedAt: true,
        certificadoDigital: true,
        _count: { select: { funcionarios: true } },
      },
      orderBy: { razaoSocial: "asc" },
    });

    const empresas = rows.map(({ certificadoDigital, ...rest }) => {
      const cert = certificadoDigital as Record<string, unknown> | null;
      return {
        ...rest,
        certificadoInfo: cert
          ? { configurado: true, validade: cert.validade ?? null, tipo: cert.tipo ?? null }
          : { configurado: false },
      };
    });

    return NextResponse.json(empresas);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar empresas" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const guard = await requireAuth();
  if (!guard.ok) return guard.response;
  const { escritorioId } = guard.session;

  try {
    const body = await request.json();
    const {
      razaoSocial,
      nomeFantasia,
      cnpj,
      inscEstadual,
      inscMunicipal,
      cnae,
      naturezaJuridica,
      regimeTributario,
      recolheINSSPatronal,
      aliquotaRAT,
      fatorMEI,
      responsavelNome,
      responsavelCPF,
      email,
      telefone,
      endereco,
      ativa,
    } = body;

    if (!razaoSocial || !cnpj) {
      return NextResponse.json({ error: "Razão Social e CNPJ são obrigatórios" }, { status: 400 });
    }

    const empresa = await db.empresa.create({
      data: {
        escritorioId,
        razaoSocial,
        nomeFantasia,
        cnpj,
        inscEstadual,
        inscMunicipal,
        cnae,
        naturezaJuridica,
        regimeTributario,
        recolheINSSPatronal,
        aliquotaRAT,
        fatorMEI,
        responsavelNome,
        responsavelCPF,
        email,
        telefone,
        endereco,
        ativa,
      },
    });
    await registrarLog({
      escritorioId,
      usuarioId: guard.session.userId,
      nomeUsuario: guard.session.name,
      tipo: "EMPRESA",
      modulo: "empresas",
      acao: "CRIAR",
      descricao: `Empresa criada: ${empresa.razaoSocial} (CNPJ ${empresa.cnpj})`,
      detalhes: { empresaId: empresa.id, cnpj: empresa.cnpj, razaoSocial: empresa.razaoSocial, regimeTributario: empresa.regimeTributario },
    });
    return NextResponse.json(empresa, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "CNPJ já cadastrado neste escritório." }, { status: 409 });
    }
    return NextResponse.json({ error: "Erro ao criar empresa" }, { status: 500 });
  }
}
