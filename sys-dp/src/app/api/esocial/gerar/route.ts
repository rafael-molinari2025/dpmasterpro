import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import {
  gerarS1000,
  gerarS1010,
  gerarS1200,
  gerarS2200,
  gerarS2299,
  gerarS1299,
  gerarXML,
} from "@/lib/esocial";
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

    const empDados: EmpresaESocial & { regimeTributario?: string } = {
      cnpj: empresa.cnpj,
      razaoSocial: empresa.razaoSocial,
      ambiente: AMBIENTE,
      regimeTributario: empresa.regimeTributario,
    };

    const eventosGerados: Array<{ tipoEvento: string; xml: string; referencia?: string; descricao: string }> = [];

    switch (tipoEvento) {

      // ── S-1000 — Cadastro da Empresa ─────────────────────────────────────
      case "S-1000": {
        const iniValid = referencia ?? `${new Date().getFullYear()}-01`;
        const obj = gerarS1000(empDados, iniValid);
        eventosGerados.push({
          tipoEvento: "S-1000",
          xml: gerarXML(obj as any),
          referencia: empresaId,
          descricao: `S-1000 — Cadastro do empregador ${empresa.razaoSocial}`,
        });
        break;
      }

      // ── S-1010 — Tabela de Rubricas ──────────────────────────────────────
      case "S-1010": {
        const rubricas = await db.rubrica.findMany({
          where: { OR: [{ global: true }, { empresaId }], ativa: true },
        });
        const obj = gerarS1010(empDados, rubricas.map((r) => ({
          codigo: r.codigo,
          descricao: r.descricao,
          natureza: r.naturezaESocial,
          tipo: r.tipo,
          incideINSS: r.incideINSS,
          incideFGTS: r.incideFGTS,
          incideIRRF: r.incideIRRF,
        })));
        eventosGerados.push({
          tipoEvento: "S-1010",
          xml: gerarXML(obj as any),
          referencia: empresaId,
          descricao: `S-1010 — Tabela de rubricas (${rubricas.length} rubricas)`,
        });
        break;
      }

      // ── S-2200 — Admissão ────────────────────────────────────────────────
      case "S-2200": {
        const funcionario = await db.funcionario.findFirst({
          where: { id: referencia, empresa: { escritorioId } },
          include: { cargo: true },
        });
        if (!funcionario) return NextResponse.json({ error: "Funcionário não encontrado" }, { status: 404 });

        const obj = gerarS2200(empDados, {
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
          ctpsUF: funcionario.ctpsUF ?? undefined,
          pisPasep: funcionario.pisPasep ?? undefined,
        });
        eventosGerados.push({
          tipoEvento: "S-2200",
          xml: gerarXML(obj as any),
          referencia: funcionario.id,
          descricao: `S-2200 — Admissão: ${funcionario.nome} (${funcionario.matricula})`,
        });
        break;
      }

      // ── S-2299 — Desligamento ────────────────────────────────────────────
      case "S-2299": {
        const funcionario = await db.funcionario.findFirst({
          where: { id: referencia, empresa: { escritorioId } },
        });
        if (!funcionario) return NextResponse.json({ error: "Funcionário não encontrado" }, { status: 404 });

        const obj = gerarS2299(empDados, {
          cpf: funcionario.cpf,
          matricula: funcionario.matricula,
          dataDemissao: (funcionario.dataDemissao ?? new Date()).toISOString().split("T")[0],
          motivoDemissao: "02",
        });
        eventosGerados.push({
          tipoEvento: "S-2299",
          xml: gerarXML(obj as any),
          referencia: funcionario.id,
          descricao: `S-2299 — Desligamento: ${funcionario.nome}`,
        });
        break;
      }

      // ── S-1200 — Remuneração (um evento por funcionário) ─────────────────
      case "S-1200": {
        const folha = await db.folha.findFirst({
          where: { id: referencia, empresa: { escritorioId } },
          include: {
            itens: {
              include: { funcionario: true, rubrica: true },
            },
          },
        });
        if (!folha) return NextResponse.json({ error: "Folha não encontrada" }, { status: 404 });

        // Agrupar itens por funcionário
        const porFuncionario = new Map<string, typeof folha.itens>();
        for (const item of folha.itens) {
          const lista = porFuncionario.get(item.funcionarioId) ?? [];
          lista.push(item);
          porFuncionario.set(item.funcionarioId, lista);
        }

        for (const [, itens] of porFuncionario) {
          const func = itens[0].funcionario;
          const obj = gerarS1200(empDados, {
            competencia: folha.competencia,
            funcionario: {
              cpf: func.cpf,
              matricula: func.matricula,
              categoria: func.categoriaESocial,
            },
            itens: itens.map((i) => ({
              codigoRubrica: i.rubrica.codigo,
              tipo: i.tipo,
              valor: parseFloat(i.valor.toString()),
            })),
          });
          eventosGerados.push({
            tipoEvento: "S-1200",
            xml: gerarXML(obj as any),
            referencia: folha.id,
            descricao: `S-1200 — Remuneração: ${func.nome} — ${folha.competencia}`,
          });
        }

        if (eventosGerados.length === 0) {
          return NextResponse.json({ error: "Nenhum funcionário na folha" }, { status: 400 });
        }
        break;
      }

      // ── S-1299 — Fechamento ──────────────────────────────────────────────
      case "S-1299": {
        const competencia = referencia as string;
        const obj = gerarS1299(empDados, competencia);
        eventosGerados.push({
          tipoEvento: "S-1299",
          xml: gerarXML(obj as any),
          referencia: competencia,
          descricao: `S-1299 — Fechamento do período ${competencia}`,
        });
        break;
      }

      default:
        return NextResponse.json({ error: `Evento ${tipoEvento} não suportado` }, { status: 400 });
    }

    // Persistir eventos gerados no banco
    const criados = await Promise.all(
      eventosGerados.map((ev) =>
        db.eventoEsocial.create({
          data: {
            empresaId,
            tipoEvento: ev.tipoEvento,
            descricao: ev.descricao,
            xmlGerado: ev.xml,
            referencia: ev.referencia,
            status: "PENDENTE",
          },
        })
      )
    );

    return NextResponse.json({
      criados: criados.length,
      eventos: criados,
    }, { status: 201 });

  } catch (error: any) {
    console.error("Erro ao gerar evento eSocial:", error);
    return NextResponse.json({ error: "Erro ao gerar evento eSocial" }, { status: 500 });
  }
}
