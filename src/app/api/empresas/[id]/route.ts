import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAuth();
  if (!guard.ok) return guard.response;
  const { escritorioId } = guard.session;
  const { id } = await params;

  const empresa = await db.empresa.findFirst({
    where: { id, escritorioId },
  });
  if (!empresa) return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });

  // Nunca expor pfxBase64 na API — retorna apenas status
  const cert = empresa.certificadoDigital as { pfxBase64?: string; validade?: string; titular?: string } | null;
  const empresaSanitized = {
    ...empresa,
    certificadoDigital: cert
      ? { configurado: true, validade: cert.validade ?? null, titular: cert.titular ?? null }
      : null,
  };

  return NextResponse.json(empresaSanitized);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAuth();
  if (!guard.ok) return guard.response;
  const { escritorioId } = guard.session;
  const { id } = await params;

  const empresa = await db.empresa.findFirst({ where: { id, escritorioId } });
  if (!empresa) return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });

  try {
    const body = await request.json();

    // Separar campos de certificado do resto
    const { certificadoPfxBase64, certificadoSenha, certificadoRemover, ...dadosEmpresa } = body;

    let certificadoDigital = empresa.certificadoDigital;

    if (certificadoRemover) {
      certificadoDigital = null;
    } else if (certificadoPfxBase64 && certificadoSenha) {
      // Extrair metadados do certificado via node-forge para salvar validade/titular
      let validade: string | null = null;
      let titular: string | null = null;
      try {
        const forge = await import("node-forge");
        const p12Der = forge.util.decode64(certificadoPfxBase64);
        const p12Asn1 = forge.asn1.fromDer(p12Der);
        const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, certificadoSenha);
        const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
        const certList = certBags[forge.pki.oids.certBag];
        if (certList?.length) {
          const cert = certList[0].cert;
          if (cert) {
            validade = cert.validity.notAfter.toISOString().split("T")[0];
            const cn = cert.subject.getField("CN");
            if (cn) titular = cn.value as string;
          }
        }
      } catch {
        // Se não conseguir ler metadados, salva sem eles
      }
      certificadoDigital = { pfxBase64: certificadoPfxBase64, senha: certificadoSenha, validade, titular };
    }

    // Converter campos numéricos
    if (dadosEmpresa.aliquotaRAT !== undefined) dadosEmpresa.aliquotaRAT = parseFloat(dadosEmpresa.aliquotaRAT);
    if (dadosEmpresa.fatorMEI !== undefined) dadosEmpresa.fatorMEI = parseFloat(dadosEmpresa.fatorMEI);

    const updated = await db.empresa.update({
      where: { id },
      data: { ...dadosEmpresa, certificadoDigital },
    });

    // Sanitizar retorno
    const cert = updated.certificadoDigital as { pfxBase64?: string; validade?: string; titular?: string } | null;
    return NextResponse.json({
      ...updated,
      certificadoDigital: cert
        ? { configurado: true, validade: cert.validade ?? null, titular: cert.titular ?? null }
        : null,
    });
  } catch (error: any) {
    console.error("Erro ao atualizar empresa:", error);
    return NextResponse.json({ error: error.message ?? "Erro ao atualizar empresa" }, { status: 500 });
  }
}
