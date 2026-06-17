import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { transmitirEventos } from "@/lib/esocial-transmissao";
import { registrarLog } from "@/lib/logger";

const AMBIENTE = (process.env.ESOCIAL_AMBIENTE ?? "2") as "1" | "2";

export async function POST(request: Request) {
  const guard = await requireAuth();
  if (!guard.ok) return guard.response;
  const { escritorioId } = guard.session;

  try {
    const body = await request.json();
    const { empresaId: empresaIdBody, eventoId } = body;

    // Suporte a reenvio individual: aceita { eventoId } ou { empresaId }
    let empresaId = empresaIdBody;
    if (eventoId && !empresaId) {
      const ev = await db.eventoEsocial.findFirst({
        where: { id: eventoId, empresa: { escritorioId } },
        select: { empresaId: true, status: true },
      });
      if (!ev) return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
      // Recolocar em PENDENTE para reenvio
      await db.eventoEsocial.update({ where: { id: eventoId }, data: { status: "PENDENTE" } });
      empresaId = ev.empresaId;
    }

    const empresa = await db.empresa.findFirst({
      where: { id: empresaId, escritorioId },
    });
    if (!empresa) return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });

    // Buscar eventos PENDENTE (inclui o que acabou de ser resetado)
    const pendentes = await db.eventoEsocial.findMany({
      where: {
        empresaId,
        status: "PENDENTE",
        ...(eventoId ? { id: eventoId } : {}),
      },
      orderBy: { createdAt: "asc" },
    });

    if (pendentes.length === 0) {
      return NextResponse.json({ message: "Nenhum evento pendente.", enviados: 0 });
    }

    // Marcar como ENVIANDO
    await db.eventoEsocial.updateMany({
      where: { id: { in: pendentes.map((e) => e.id) } },
      data: { status: "ENVIANDO" },
    });

    // Ler configuração de certificado (empresa ou variável de ambiente)
    const certConfig = empresa.certificadoDigital as { pfxBase64?: string; senha?: string } | null;
    const pfxBase64 = certConfig?.pfxBase64 ?? process.env.ESOCIAL_CERT_BASE64;
    const senha = certConfig?.senha ?? process.env.ESOCIAL_CERT_SENHA;

    // Preparar lista de eventos com XML
    const eventosParaEnviar = pendentes
      .filter((e) => !!e.xmlGerado)
      .map((e) => ({ id: e.id, xml: e.xmlGerado as string }));

    if (eventosParaEnviar.length === 0) {
      await db.eventoEsocial.updateMany({
        where: { id: { in: pendentes.map((e) => e.id) } },
        data: { status: "PENDENTE" },
      });
      return NextResponse.json({ error: "Nenhum evento com XML gerado." }, { status: 400 });
    }

    // Transmitir (real ou demo)
    const resultado = await transmitirEventos(
      eventosParaEnviar,
      empresa.cnpj,
      AMBIENTE,
      pfxBase64,
      senha
    );

    // Atualizar status para ENVIADO com protocolo
    await db.eventoEsocial.updateMany({
      where: { id: { in: pendentes.map((e) => e.id) } },
      data: {
        status: "ENVIADO",
        protocolo: resultado.protocolo,
        xmlRetorno: resultado.xmlRetorno,
        dataEnvio: new Date(),
      },
    });

    await registrarLog({
      escritorioId,
      usuarioId: guard.session.userId,
      nomeUsuario: guard.session.name,
      nivel: resultado.modoDemo ? "AVISO" : "INFO",
      tipo: "ESOCIAL",
      modulo: "esocial",
      acao: "TRANSMITIR",
      descricao: `eSocial transmitido: ${empresa.razaoSocial} — ${eventosParaEnviar.length} evento(s)${resultado.modoDemo ? " [MODO DEMO]" : ""}`,
      detalhes: {
        empresaId,
        empresaNome: empresa.razaoSocial,
        quantidadeEventos: eventosParaEnviar.length,
        protocolo: resultado.protocolo,
        modoDemo: resultado.modoDemo,
        ambiente: AMBIENTE === "1" ? "Produção" : "Homologação",
      },
    });

    return NextResponse.json({
      enviados: eventosParaEnviar.length,
      protocolo: resultado.protocolo,
      descricao: resultado.descricao,
      modoDemo: resultado.modoDemo,
    });

  } catch (error: any) {
    console.error("Erro ao enviar eventos eSocial:", error);
    return NextResponse.json({ error: "Erro ao transmitir eventos eSocial" }, { status: 500 });
  }
}
