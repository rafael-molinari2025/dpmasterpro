import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { registrarLog } from "@/lib/logger";
import { encryptCert } from "@/lib/encryption";

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

    // Separar campos de certificado e extrair apenas os campos permitidos
    const {
      certificadoPfxBase64,
      certificadoSenha,
      certificadoRemover,
      razaoSocial,
      nomeFantasia,
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
      } catch (certErr: any) {
        const msg: string = certErr?.message ?? "";
        // Erro de senha → informar o usuário; outro erro → salva sem metadados
        if (
          msg.toLowerCase().includes("mac") ||
          msg.toLowerCase().includes("password") ||
          msg.toLowerCase().includes("invalid") ||
          msg.toLowerCase().includes("wrong")
        ) {
          return NextResponse.json(
            { error: "Senha do certificado inválida ou arquivo corrompido." },
            { status: 400 }
          );
        }
      }
      certificadoDigital = process.env.ENCRYPTION_KEY
        ? encryptCert(certificadoPfxBase64, certificadoSenha, { validade, titular })
        : { pfxBase64: certificadoPfxBase64, senha: certificadoSenha, validade, titular };
    }

    // Montar objeto de atualização somente com campos permitidos
    const dadosUpdate: Record<string, unknown> = { certificadoDigital };
    if (razaoSocial !== undefined) dadosUpdate.razaoSocial = razaoSocial;
    if (nomeFantasia !== undefined) dadosUpdate.nomeFantasia = nomeFantasia;
    if (inscEstadual !== undefined) dadosUpdate.inscEstadual = inscEstadual;
    if (inscMunicipal !== undefined) dadosUpdate.inscMunicipal = inscMunicipal;
    if (cnae !== undefined) dadosUpdate.cnae = cnae;
    if (naturezaJuridica !== undefined) dadosUpdate.naturezaJuridica = naturezaJuridica;
    if (regimeTributario !== undefined) dadosUpdate.regimeTributario = regimeTributario;
    if (recolheINSSPatronal !== undefined) dadosUpdate.recolheINSSPatronal = recolheINSSPatronal;
    if (aliquotaRAT !== undefined) dadosUpdate.aliquotaRAT = parseFloat(aliquotaRAT);
    if (fatorMEI !== undefined) dadosUpdate.fatorMEI = parseFloat(fatorMEI);
    if (responsavelNome !== undefined) dadosUpdate.responsavelNome = responsavelNome;
    if (responsavelCPF !== undefined) dadosUpdate.responsavelCPF = responsavelCPF;
    if (email !== undefined) dadosUpdate.email = email;
    if (telefone !== undefined) dadosUpdate.telefone = telefone;
    if (endereco !== undefined) dadosUpdate.endereco = endereco;
    if (ativa !== undefined) dadosUpdate.ativa = ativa;

    const updated = await db.empresa.update({
      where: { id },
      data: dadosUpdate,
    });

    const certAtualizado = certificadoPfxBase64 ? "certificado atualizado" : certificadoRemover ? "certificado removido" : null;
    await registrarLog({
      escritorioId,
      usuarioId: guard.session.userId,
      nomeUsuario: guard.session.name,
      tipo: "EMPRESA",
      modulo: "empresas",
      acao: "EDITAR",
      descricao: `Empresa editada: ${updated.razaoSocial}${certAtualizado ? ` (${certAtualizado})` : ""}`,
      detalhes: { empresaId: id, ...(certAtualizado ? { certificado: certAtualizado } : {}) },
    });

    const cert = updated.certificadoDigital as { pfxBase64?: string; validade?: string; titular?: string } | null;
    return NextResponse.json({
      ...updated,
      certificadoDigital: cert
        ? { configurado: true, validade: cert.validade ?? null, titular: cert.titular ?? null }
        : null,
    });
  } catch (error: any) {
    console.error("Erro ao atualizar empresa:", error);
    return NextResponse.json({ error: "Erro ao atualizar empresa" }, { status: 500 });
  }
}
