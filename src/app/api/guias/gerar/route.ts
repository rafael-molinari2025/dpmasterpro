import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { empresaId, folhaId, competencia } = await request.json();

    const folha = await db.folha.findUnique({ where: { id: folhaId } });
    if (!folha) {
      return NextResponse.json({ error: "Folha não encontrada" }, { status: 404 });
    }

    const [ano, mes] = competencia.split("-").map(Number);

    // Data de vencimento GPS/DARF: dia 20 do mês seguinte
    const mesVencimento = mes === 12 ? 1 : mes + 1;
    const anoVencimento = mes === 12 ? ano + 1 : ano;

    const vencimentoGPS = new Date(anoVencimento, mesVencimento - 1, 20);
    const vencimentoFGTS = new Date(anoVencimento, mesVencimento - 1, 7);
    const vencimentoDCTF = new Date(anoVencimento, mesVencimento - 1, 15);

    const guiasCriadas = [];

    const totalINSS = parseFloat(folha.totalINSSEmpregado.toString()) +
                      parseFloat(folha.totalINSSPatronal.toString());
    const totalIRRF = parseFloat(folha.totalIRRF.toString());
    const totalFGTS = parseFloat(folha.totalFGTS.toString());

    // GPS — INSS
    if (totalINSS > 0) {
      const gps = await db.guiaPagamento.create({
        data: {
          empresaId,
          folhaId,
          tipo: "GPS_INSS",
          competencia,
          dataVencimento: vencimentoGPS,
          valorPrincipal: totalINSS,
          valorTotal: totalINSS,
          status: "PENDENTE",
        },
      });
      guiasCriadas.push(gps);
    }

    // DARF — IRRF
    if (totalIRRF > 0) {
      const darf = await db.guiaPagamento.create({
        data: {
          empresaId,
          folhaId,
          tipo: "DARF_IRRF",
          competencia,
          dataVencimento: vencimentoGPS,
          valorPrincipal: totalIRRF,
          valorTotal: totalIRRF,
          status: "PENDENTE",
        },
      });
      guiasCriadas.push(darf);
    }

    // FGTS Digital
    if (totalFGTS > 0) {
      const fgts = await db.guiaPagamento.create({
        data: {
          empresaId,
          folhaId,
          tipo: "FGTS_DIGITAL",
          competencia,
          dataVencimento: vencimentoFGTS,
          valorPrincipal: totalFGTS,
          valorTotal: totalFGTS,
          pixCopiaCola: `00020126330014br.gov.fgts.pix0111${empresaId.slice(0,11)}5204000053039865406${totalFGTS.toFixed(2).replace(".", "")}5802BR5920FGTS Digital${competencia}6009SAO PAULO62070503***6304`,
          status: "PENDENTE",
        },
      });
      guiasCriadas.push(fgts);
    }

    // DCTFWeb
    const dctf = await db.guiaPagamento.create({
      data: {
        empresaId,
        folhaId,
        tipo: "DCTFWEB",
        competencia,
        dataVencimento: vencimentoDCTF,
        valorPrincipal: totalINSS + totalIRRF,
        valorTotal: totalINSS + totalIRRF,
        status: "PENDENTE",
      },
    });
    guiasCriadas.push(dctf);

    return NextResponse.json({
      guias: guiasCriadas,
      total: guiasCriadas.reduce((s, g) => s + parseFloat(g.valorTotal.toString()), 0),
    });
  } catch (error) {
    console.error("Erro ao gerar guias:", error);
    return NextResponse.json({ error: "Erro ao gerar guias de pagamento" }, { status: 500 });
  }
}
