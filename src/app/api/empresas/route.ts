import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { registrarLog } from "@/lib/logger";

export async function GET() {
  const guard = await requireAuth();
  if (!guard.ok) return guard.response;
  const { escritorioId } = guard.session;

  try {
    const rows = await db.empresa.findMany({
      where: { escritorioId },
      select: {
        id: true,
        escritorioId: true,
        razaoSocial: true,
        nomeFantasia: true,
        cnpj: true,
        inscEstadual: true,
        inscMunicipal: true,
        cnae: true,
        naturezaJuridica: true,
        regimeTributario: true,
        recolheINSSPatronal: true,
        aliquotaRAT: true,
        fatorMEI: true,
        responsavelNome: true,
        responsavelCPF: true,
        email: true,
        telefone: true,
        endereco: true,
        ativa: true,
        createdAt: true,
        updatedAt: true,
        certificadoDigital: true,
        _count: { select: { funcionarios: true } },
      },
      orderBy: { razaoSocial: "asc" },
    });

    const empresas = rows.map(({ certificadoDigital, ...rest }) => {
      const cert = certificadoDigital as Record<string, unknown> | null;
      return {
        ...rest,
        certificadoInfo: cert
          ? { configurado: true, validade: cert.validade ?? null, tipo: cert.tipo ?? null }
          : { configurado: false },
      };
    });

    return NextResponse.json(empresas);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar empresas" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const guard = await requireAuth();
  if (!guard.ok) return guard.response;
  const { escritorioId } = guard.session;

  try {
    const body = await request.json();
    const {
      razaoSocial,
      nomeFantasia,
      cnpj,
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
      certificadoPfxBase64,
      certificadoSenha,
    } = body;

    if (!razaoSocial || !cnpj) {
      return NextResponse.json({ error: "Razão Social e CNPJ são obrigatórios" }, { status: 400 });
    }

    // Processar certificado digital se fornecido
    let certificadoDigital: Record<string, unknown> | null = null;
    if (certificadoPfxBase64 && certificadoSenha) {
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
      certificadoDigital = { pfxBase64: certificadoPfxBase64, senha: certificadoSenha, validade, titular };
    }

    const empresa = await db.empresa.create({
      data: {
        escritorioId,
        razaoSocial,
        nomeFantasia,
        cnpj,
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
        ...(certificadoDigital ? { certificadoDigital } : {}),
      },
    });
    await registrarLog({
      escritorioId,
      usuarioId: guard.session.userId,
      nomeUsuario: guard.session.name,
      tipo: "EMPRESA",
      modulo: "empresas",
      acao: "CRIAR",
      descricao: `Empresa criada: ${empresa.razaoSocial} (CNPJ ${empresa.cnpj})`,
      detalhes: { empresaId: empresa.id, cnpj: empresa.cnpj, razaoSocial: empresa.razaoSocial, regimeTributario: empresa.regimeTributario },
    });
    return NextResponse.json(empresa, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "CNPJ já cadastrado neste escritório." }, { status: 409 });
    }
    return NextResponse.json({ error: "Erro ao criar empresa" }, { status: 500 });
  }
}
