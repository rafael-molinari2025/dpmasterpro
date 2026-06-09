import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { registrarLog } from "@/lib/logger";

export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { escritorioId } = guard.session;

  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get("tipo") ?? "completo";

  try {
    const agora = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

    let dados: Record<string, unknown> = {};

    if (tipo === "empresas" || tipo === "completo") {
      dados.empresas = await db.empresa.findMany({
        where: { escritorioId },
        select: {
          id: true, razaoSocial: true, nomeFantasia: true, cnpj: true,
          inscEstadual: true, inscMunicipal: true, cnae: true,
          regimeTributario: true, aliquotaRAT: true, fatorMEI: true,
          recolheINSSPatronal: true, responsavelNome: true, responsavelCPF: true,
          email: true, telefone: true, endereco: true, ativa: true, createdAt: true,
        },
      });
    }

    if (tipo === "funcionarios" || tipo === "completo") {
      dados.funcionarios = await db.funcionario.findMany({
        where: { empresa: { escritorioId } },
        select: {
          id: true, empresaId: true, matricula: true, nome: true, cpf: true,
          dataNascimento: true, sexo: true, estadoCivil: true, nacionalidade: true,
          naturalidade: true, escolaridade: true, rg: true, rgOrgao: true, rgUF: true,
          ctps: true, ctpsSerie: true, ctpsUF: true, pisPasep: true,
          tipoContrato: true, dataAdmissao: true, dataDemissao: true,
          salario: true, jornadaHoras: true, tipoJornada: true,
          categoriaESocial: true, situacao: true, email: true, celular: true,
          telefone: true, endereco: true, banco: true, agencia: true,
          conta: true, tipoConta: true, createdAt: true,
        },
      });
    }

    if (tipo === "folha" || tipo === "completo") {
      dados.folhas = await db.folha.findMany({
        where: { empresa: { escritorioId } },
        include: { itens: true },
      });
    }

    if (tipo === "esocial" || tipo === "completo") {
      dados.eventosEsocial = await db.eventoEsocial.findMany({
        where: { empresa: { escritorioId } },
        select: {
          id: true, empresaId: true, tipoEvento: true, descricao: true,
          status: true, protocolo: true, referencia: true,
          dataEnvio: true, createdAt: true,
        },
      });
    }

    if (tipo === "usuarios") {
      dados.usuarios = await db.usuario.findMany({
        where: { escritorioId },
        select: {
          id: true, nome: true, email: true, perfil: true,
          permissoes: true, ativo: true, createdAt: true,
        },
      });
    }

    const payload = {
      exportadoEm: new Date().toISOString(),
      escritorioId,
      versao: "1.0",
      tipo,
      dados,
    };

    const json = JSON.stringify(payload, (_, v) =>
      typeof v === "bigint" ? v.toString() : v, 2);

    await registrarLog({
      escritorioId,
      usuarioId: guard.session.userId,
      nomeUsuario: guard.session.name,
      tipo: "BACKUP",
      modulo: "backup",
      acao: "DOWNLOAD",
      descricao: `Backup baixado: tipo "${tipo}"`,
      detalhes: { tipo, arquivo: `backup-dp-${tipo}-${agora}.json` },
    });

    return new NextResponse(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="backup-dp-${tipo}-${agora}.json"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Erro ao gerar backup" }, { status: 500 });
  }
}
