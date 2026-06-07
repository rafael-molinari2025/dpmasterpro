import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { gerarS1010, gerarS1200, gerarS2200, gerarS1299 } from "@/lib/esocial";
import type { EmpresaESocial } from "@/lib/esocial";

const AMBIENTE = (process.env.ESOCIAL_AMBIENTE ?? "2") as "1" | "2";

export async function POST(request: Request) {
  const guard = await requireAuth();
  if (!guard.ok) return guard.response;
  const { escritorioId } = guard.session;

  try {
    const { empresaId, tipoEvento, referencia } = await request.json();

    const empresa = await db.empresa.findFirst({
      where: { id: empresaId, escritorioId },
    });
    if (!empresa) return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });

    const empDados: EmpresaESocial = {
      cnpj: empresa.cnpj,
      razaoSocial: empresa.razaoSocial,
      ambiente: AMBIENTE,
    };

    let xmlGerado: object | null = null;

    switch (tipoEvento) {
      case "S-1010": {
        const rubricas = await db.rubrica.findMany({
          where: { OR: [{ global: true }, { empresaId }] },
        });
        xmlGerado = gerarS1010(empDados, rubricas.map((r) => ({
          codigo: r.codigo,
          descricao: r.descricao,
          natureza: r.naturezaESocial,
          tipo: r.tipo,
          incideINSS: r.incideINSS,
          incideFGTS: r.incideFGTS,
          incideIRRF: r.incideIRRF,
        })));
        break;
      }

      case "S-2200": {
        const funcionario = await db.funcionario.findFirst({
          where: { id: referencia, empresa: { escritorioId } },
          include: { cargo: true },
        });
        if (!funcionario) return NextResponse.json({ error: "Funcionário não encontrado" }, { status: 404 });
        xmlGerado = gerarS2200(empDados, {
          cpf: funcionario.cpf,
          nome: funcionario.nome,
          dataNascimento: funcionario.dataNascimento.toISOString().split("T")[0],
          sexo: funcionario.sexo,
          matricula: funcionario.matricula,
          dataAdmissao: funcionario.dataAdmissao.toISOString().split("T")[0],
          cargo: funcionario.cargo?.descricao ?? "Não informado",
          salario: parseFloat(funcionario.salario.toString()),
          categoria: funcionario.categoriaESocial,
          jornadaHoras: funcionario.jornadaHoras,
          ctps: funcionario.ctps ?? undefined,
          pisPasep: funcionario.pisPasep ?? undefined,
        });
        break;
      }

      case "S-1200": {
        const folha = await db.folha.findFirst({
          where: { id: referencia, empresa: { escritorioId } },
          include: { itens: { include: { funcionario: true, rubrica: true } } },
        });
        if (!folha) return NextResponse.json({ error: "Folha não encontrada" }, { status: 404 });
        const primeiroFuncionario = folha.itens[0]?.funcionario;
        if (primeiroFuncionario) {
          const itensFuncionario = folha.itens.filter((i) => i.funcionarioId === primeiroFuncionario.id);
          xmlGerado = gerarS1200(empDados, {
            competencia: folha.competencia,
            funcionario: {
              cpf: primeiroFuncionario.cpf,
              matricula: primeiroFuncionario.matricula,
              categoria: primeiroFuncionario.categoriaESocial,
            },
            remuneracao: {
              totalBruto: parseFloat(folha.totalProventos.toString()),
              baseINSS: parseFloat(folha.totalINSSEmpregado.toString()),
              baseFGTS: parseFloat(folha.totalFGTS.toString()),
              baseIRRF: parseFloat(folha.totalIRRF.toString()),
            },
            itens: itensFuncionario.map((item) => ({
              codigoRubrica: item.rubrica.codigo,
              tipo: item.tipo,
              valor: parseFloat(item.valor.toString()),
            })),
          });
        }
        break;
      }

      case "S-1299": {
        xmlGerado = gerarS1299(empDados, referencia);
        break;
      }

      default:
        return NextResponse.json({ error: `Evento ${tipoEvento} não suportado nesta versão` }, { status: 400 });
    }

    const evento = await db.eventoEsocial.create({
      data: {
        empresaId,
        tipoEvento,
        descricao: `${tipoEvento} — gerado em ${new Date().toLocaleString("pt-BR")}`,
        xmlGerado: JSON.stringify(xmlGerado),
        referencia,
        status: "PENDENTE",
      },
    });

    return NextResponse.json({ evento, xml: xmlGerado });
  } catch (error) {
    console.error("Erro ao gerar evento eSocial:", error);
    return NextResponse.json({ error: "Erro ao gerar evento" }, { status: 500 });
  }
}
