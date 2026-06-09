import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { registrarLog } from "@/lib/logger";

export async function GET(request: Request) {
  const guard = await requireAuth();
  if (!guard.ok) return guard.response;
  const { escritorioId } = guard.session;

  const { searchParams } = new URL(request.url);
  const empresaId = searchParams.get("empresaId");
  const situacao = searchParams.get("situacao");
  const q = searchParams.get("q");

  try {
    if (empresaId) {
      const empresa = await db.empresa.findFirst({ where: { id: empresaId, escritorioId } });
      if (!empresa) return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    const funcionarios = await db.funcionario.findMany({
      where: {
        empresa: { escritorioId },
        ...(empresaId && { empresaId }),
        ...(situacao && { situacao: situacao as any }),
        ...(q && {
          OR: [
            { nome: { contains: q, mode: "insensitive" } },
            { cpf: { contains: q } },
            { matricula: { contains: q } },
          ],
        }),
      },
      include: {
        cargo: { select: { descricao: true } },
        setor: { select: { descricao: true } },
        empresa: { select: { razaoSocial: true, nomeFantasia: true } },
      },
      orderBy: { nome: "asc" },
    });
    return NextResponse.json(funcionarios);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar funcionários" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const guard = await requireAuth();
  if (!guard.ok) return guard.response;
  const { escritorioId } = guard.session;

  try {
    const body = await request.json();
    const empresa = await db.empresa.findFirst({ where: { id: body.empresaId, escritorioId } });
    if (!empresa) return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });

    const {
      empresaId,
      cargoId,
      setorId,
      matricula,
      nome,
      cpf,
      rg,
      rgOrgao,
      rgUF,
      dataNascimento,
      sexo,
      estadoCivil,
      escolaridade,
      pcd,
      tipoPCD,
      naturalidade,
      nacionalidade,
      email,
      telefone,
      celular,
      endereco,
      tipoContrato,
      dataAdmissao,
      dataDemissao,
      salario,
      jornadaHoras,
      tipoJornada,
      ctps,
      ctpsSerie,
      ctpsUF,
      pisPasep,
      categoriaESocial,
      optanteFGTS,
      contaFGTS,
      sindicatoId,
      banco,
      agencia,
      conta,
      tipoConta,
      situacao,
      motivoDemissao,
    } = body;

    if (!empresaId || !matricula || !nome || !cpf || !dataNascimento || !sexo || !dataAdmissao || !salario) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
    }

    const funcionario = await db.funcionario.create({
      data: {
        empresaId,
        cargoId,
        setorId,
        matricula,
        nome,
        cpf,
        rg,
        rgOrgao,
        rgUF,
        dataNascimento,
        sexo,
        estadoCivil,
        escolaridade,
        pcd,
        tipoPCD,
        naturalidade,
        nacionalidade,
        email,
        telefone,
        celular,
        endereco,
        tipoContrato,
        dataAdmissao,
        dataDemissao,
        salario,
        jornadaHoras,
        tipoJornada,
        ctps,
        ctpsSerie,
        ctpsUF,
        pisPasep,
        categoriaESocial,
        optanteFGTS,
        contaFGTS,
        sindicatoId,
        banco,
        agencia,
        conta,
        tipoConta,
        situacao,
        motivoDemissao,
      },
      include: {
        cargo: { select: { descricao: true } },
        setor: { select: { descricao: true } },
      },
    });
    await registrarLog({
      escritorioId,
      usuarioId: guard.session.userId,
      nomeUsuario: guard.session.name,
      tipo: "FUNCIONARIO",
      modulo: "funcionarios",
      acao: "CRIAR",
      descricao: `Funcionário cadastrado: ${funcionario.nome} — Matrícula ${funcionario.matricula} (${empresa.razaoSocial})`,
      detalhes: { funcionarioId: funcionario.id, nome: funcionario.nome, matricula: funcionario.matricula, empresaId: funcionario.empresaId, tipoContrato: funcionario.tipoContrato },
    });
    return NextResponse.json(funcionario, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "CPF ou matrícula já cadastrado nesta empresa" }, { status: 409 });
    }
    return NextResponse.json({ error: "Erro ao criar funcionário" }, { status: 500 });
  }
}
