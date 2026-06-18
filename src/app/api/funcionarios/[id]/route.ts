import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { hasPermissao } from "@/lib/permissoes";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAuth();
  if (!guard.ok) return guard.response;
  const { escritorioId } = guard.session;

  const { id } = await params;
  const func = await db.funcionario.findFirst({
    where: { id, empresa: { escritorioId } },
    include: {
      cargo: { select: { id: true, descricao: true, codigo: true } },
      setor: { select: { id: true, descricao: true, codigo: true } },
      empresa: { select: { id: true, razaoSocial: true, nomeFantasia: true } },
    },
  });

  if (!func) return NextResponse.json({ error: "Funcionário não encontrado" }, { status: 404 });
  return NextResponse.json(func);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAuth();
  if (!guard.ok) return guard.response;
  const { escritorioId, perfil, permissoes } = guard.session;

  if (!hasPermissao(perfil, permissoes as string[], "funcionarios")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const existing = await db.funcionario.findFirst({
    where: { id, empresa: { escritorioId } },
  });
  if (!existing) return NextResponse.json({ error: "Funcionário não encontrado" }, { status: 404 });

  const {
    nome, email, telefone, celular,
    cargoId, setorId,
    salario, jornadaHoras, tipoJornada, tipoContrato,
    estadoCivil, escolaridade, naturalidade, nacionalidade,
    rg, rgOrgao, rgUF,
    ctps, ctpsSerie, ctpsUF,
    pisPasep, banco, agencia, conta, tipoConta,
    categoriaESocial,
    situacao,
    endereco,
  } = body;

  const data: Record<string, unknown> = {};
  if (nome !== undefined) data.nome = nome;
  if (email !== undefined) data.email = email || null;
  if (telefone !== undefined) data.telefone = telefone || null;
  if (celular !== undefined) data.celular = celular || null;
  if (cargoId !== undefined) data.cargoId = cargoId || null;
  if (setorId !== undefined) data.setorId = setorId || null;
  if (salario !== undefined) data.salario = parseFloat(salario);
  if (jornadaHoras !== undefined) data.jornadaHoras = parseInt(jornadaHoras);
  if (tipoJornada !== undefined) data.tipoJornada = tipoJornada;
  if (tipoContrato !== undefined) data.tipoContrato = tipoContrato;
  if (estadoCivil !== undefined) data.estadoCivil = estadoCivil;
  if (escolaridade !== undefined) data.escolaridade = escolaridade || null;
  if (naturalidade !== undefined) data.naturalidade = naturalidade || null;
  if (nacionalidade !== undefined) data.nacionalidade = nacionalidade;
  if (rg !== undefined) data.rg = rg || null;
  if (rgOrgao !== undefined) data.rgOrgao = rgOrgao || null;
  if (rgUF !== undefined) data.rgUF = rgUF || null;
  if (ctps !== undefined) data.ctps = ctps || null;
  if (ctpsSerie !== undefined) data.ctpsSerie = ctpsSerie || null;
  if (ctpsUF !== undefined) data.ctpsUF = ctpsUF || null;
  if (pisPasep !== undefined) data.pisPasep = pisPasep || null;
  if (banco !== undefined) data.banco = banco || null;
  if (agencia !== undefined) data.agencia = agencia || null;
  if (conta !== undefined) data.conta = conta || null;
  if (tipoConta !== undefined) data.tipoConta = tipoConta || null;
  if (categoriaESocial !== undefined) data.categoriaESocial = categoriaESocial;
  if (situacao !== undefined) data.situacao = situacao;
  if (endereco !== undefined) data.endereco = endereco;

  const updated = await db.funcionario.update({ where: { id }, data });

  // Record salary change if salary was updated
  if (salario !== undefined) {
    const novoSalario = parseFloat(salario);
    const salarioAnterior = parseFloat(existing.salario.toString());
    if (Math.abs(novoSalario - salarioAnterior) > 0.001) {
      await db.historicoSalario.create({
        data: {
          funcionarioId: id,
          salarioAnterior,
          salarioNovo: novoSalario,
          dataAlteracao: new Date(),
          motivo: "Alteração via sistema",
        },
      }).catch(() => {});
    }
  }

  return NextResponse.json(updated);
}
