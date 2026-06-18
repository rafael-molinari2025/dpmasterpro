import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";

export async function POST(request: Request) {
  const guard = await requireAuth();
  if (!guard.ok) return guard.response;
  const { escritorioId } = guard.session;

  try {
    const { empresaId, folhaId, competencia } = await request.json();

    const empresa = await db.empresa.findFirst({ where: { id: empresaId, escritorioId } });
    if (!empresa) return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });

    const folha = await db.folha.findFirst({ where: { id: folhaId, empresaId } });
    if (!folha) return NextResponse.json({ error: "Folha não encontrada" }, { status: 404 });

    // Check for existing guias for this folha
    const existentes = await db.guiaPagamento.count({ where: { folhaId } });
    if (existentes > 0) {
      return NextResponse.json({ error: "Guias já foram geradas para esta folha" }, { status: 409 });
    }

    const [ano, mes] = competencia.split("-").map(Number);
    const mesVencimento = mes === 12 ? 1 : mes + 1;
    const anoVencimento = mes === 12 ? ano + 1 : ano;

    const vencimentoGPS = new Date(anoVencimento, mesVencimento - 1, 20);
    const vencimentoFGTS = new Date(anoVencimento, mesVencimento - 1, 7);
    const vencimentoDCTF = new Date(anoVencimento, mesVencimento - 1, 15);

    const guiasCriadas = [];
    const totalINSS = parseFloat(folha.totalINSSEmpregado.toString()) + parseFloat(folha.totalINSSPatronal.toString());
    const totalIRRF = parseFloat(folha.totalIRRF.toString());
    const totalFGTS = parseFloat(folha.totalFGTS.toString());

    if (totalINSS > 0) {
      guiasCriadas.push(await db.guiaPagamento.create({
        data: { empresaId, folhaId, tipo: "GPS_INSS", competencia, dataVencimento: vencimentoGPS, valorPrincipal: totalINSS, valorTotal: totalINSS, status: "PENDENTE" },
      }));
    }

    if (totalIRRF > 0) {
      guiasCriadas.push(await db.guiaPagamento.create({
        data: {
          empresaId, folhaId, tipo: "DARF_IRRF", competencia,
          dataVencimento: vencimentoGPS,
          valorPrincipal: totalIRRF, valorTotal: totalIRRF,
          codigoBarras: "1361", // Código de receita IRRF sobre trabalho assalariado (IN RFB 2.055/2021)
          status: "PENDENTE",
        },
      }));
    }

    if (totalFGTS > 0) {
      guiasCriadas.push(await db.guiaPagamento.create({
        data: {
          empresaId, folhaId, tipo: "FGTS_DIGITAL", competencia, dataVencimento: vencimentoFGTS, valorPrincipal: totalFGTS, valorTotal: totalFGTS,
          pixCopiaCola: `00020126360014br.gov.fgts.pix0114${empresa.cnpj.replace(/\D/g, "").padEnd(14, "0")}5204000053039865406${totalFGTS.toFixed(2).replace(".", "")}5802BR5920FGTS Digital6009SAO PAULO62070503***6304`,
          status: "PENDENTE",
        },
      }));
    }

    guiasCriadas.push(await db.guiaPagamento.create({
      data: { empresaId, folhaId, tipo: "DCTFWEB", competencia, dataVencimento: vencimentoDCTF, valorPrincipal: totalINSS + totalIRRF, valorTotal: totalINSS + totalIRRF, status: "PENDENTE" },
    }));

    return NextResponse.json({
      guias: guiasCriadas,
      total: guiasCriadas.reduce((s, g) => s + parseFloat(g.valorTotal.toString()), 0),
    });
  } catch (error) {
    console.error("Erro ao gerar guias:", error);
    return NextResponse.json({ error: "Erro ao gerar guias de pagamento" }, { status: 500 });
  }
}
