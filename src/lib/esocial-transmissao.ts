// ─── Assinatura Digital XMLDSig + Transmissão ao Gateway eSocial S-1.3 ────────
// Suporta dois modos:
//   • Real  — certificate PFX disponível → assina e transmite ao governo
//   • Demo  — sem certificado → simula transmissão (protocolo gerado localmente)

import https from "https";
import forge from "node-forge";

// URLs do gateway eSocial REST (S-1.3)
const GATEWAY: Record<"1" | "2", string> = {
  "1": "https://esocial.gov.br/servicos/empregador/evento/envioLoteEventos/aguardarRetorno/v1_1_0",
  "2": "https://ehr.esocial.gov.br/servicos/empregador/evento/envioLoteEventos/aguardarRetorno/v1_1_0",
};

// ─── Assinatura XMLDSig ───────────────────────────────────────────────────────
// Implementa XMLDSig enveloped-signature com RSA-SHA256 conforme especificação
// eSocial S-1.3. O digest é calculado sobre a forma canônica (C14N) do elemento
// de evento identificado pelo atributo "Id".
export function assinarEvento(xmlEvento: string, pfxBase64: string, senha: string): string {
  // Parsear certificado PFX
  const p12Der = forge.util.decode64(pfxBase64);
  const p12Asn1 = forge.asn1.fromDer(p12Der);
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, senha);

  // Extrair chave privada
  let privateKey: forge.pki.rsa.PrivateKey | null = null;
  const shrouded = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  const shroudedList = shrouded[forge.pki.oids.pkcs8ShroudedKeyBag];
  if (shroudedList?.length) {
    privateKey = shroudedList[0].key as forge.pki.rsa.PrivateKey;
  } else {
    const kb = p12.getBags({ bagType: forge.pki.oids.keyBag });
    const kbList = kb[forge.pki.oids.keyBag];
    if (kbList?.length) privateKey = kbList[0].key as forge.pki.rsa.PrivateKey;
  }

  // Extrair certificado público
  let cert: forge.pki.Certificate | null = null;
  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
  const certList = certBags[forge.pki.oids.certBag];
  if (certList?.length) cert = certList[0].cert ?? null;

  if (!privateKey || !cert) throw new Error("Certificado PFX inválido ou sem chave privada.");

  // Extrair Id do evento e namespace raiz
  const idMatch = xmlEvento.match(/\sId="([^"]+)"/);
  if (!idMatch) throw new Error("Elemento de evento sem atributo Id.");
  const elementId = idMatch[1];

  const nsMatch = xmlEvento.match(/xmlns="([^"]+)"/);
  const xmlns = nsMatch?.[1] ?? "";

  // Extrair nome da tag do evento (evtAdmissao, evtRemun, etc.)
  const evtTagMatch = xmlEvento.match(/<(evt\w+)[\s>]/);
  if (!evtTagMatch) throw new Error("Tag de evento não encontrada no XML.");
  const evtTag = evtTagMatch[1];

  // Extrair conteúdo do elemento de evento
  const evtRegex = new RegExp(`(<${evtTag}[\\s\\S]*?<\\/${evtTag}>)`);
  const evtMatch = xmlEvento.match(evtRegex);
  if (!evtMatch) throw new Error(`Elemento <${evtTag}> não encontrado.`);

  // Forma canônica do elemento: adiciona o xmlns herdado do pai <eSocial>
  // Isso é necessário para o XMLDSig enveloped-signature com C14N
  const evtXmlRaw = evtMatch[1];
  const firstClose = evtXmlRaw.indexOf(">");
  const openTag = evtXmlRaw.substring(0, firstClose + 1);
  const rest = evtXmlRaw.substring(firstClose + 1);
  const evtXmlC14n = openTag.replace(`<${evtTag}`, `<${evtTag} xmlns="${xmlns}"`) + rest;

  // DigestValue: SHA-256 da forma canônica do elemento de evento
  const mdDigest = forge.md.sha256.create();
  mdDigest.update(forge.util.encodeUtf8(evtXmlC14n));
  const digestValue = forge.util.encode64(mdDigest.digest().getBytes());

  // SignedInfo (serializado sem whitespace desnecessário para C14N)
  const signedInfo = [
    '<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#">',
    '<CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>',
    '<SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>',
    `<Reference URI="#${elementId}">`,
    "<Transforms>",
    '<Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>',
    '<Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>',
    "</Transforms>",
    '<DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>',
    `<DigestValue>${digestValue}</DigestValue>`,
    "</Reference>",
    "</SignedInfo>",
  ].join("");

  // SignatureValue: RSA-SHA256 do SignedInfo canônico
  const mdSig = forge.md.sha256.create();
  mdSig.update(forge.util.encodeUtf8(signedInfo));
  const sigBytes = privateKey.sign(mdSig);
  const signatureValue = forge.util.encode64(sigBytes);

  // Certificado em DER base64 para KeyInfo
  const certDer = forge.util.encode64(
    forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes()
  );

  // Montar elemento <Signature> e inserir antes de </eSocial>
  const signature = [
    '<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">',
    signedInfo,
    `<SignatureValue>${signatureValue}</SignatureValue>`,
    "<KeyInfo><X509Data>",
    `<X509Certificate>${certDer}</X509Certificate>`,
    "</X509Data></KeyInfo>",
    "</Signature>",
  ].join("\n");

  return xmlEvento.replace("</eSocial>", `${signature}\n</eSocial>`);
}

// ─── Envelope de lote ─────────────────────────────────────────────────────────
export function montarLote(
  eventos: Array<{ id: string; xml: string }>,
  cnpj: string
): string {
  const c = cnpj.replace(/\D/g, "");
  const eventsXml = eventos
    .map((ev, i) => `  <evento Id="ev${i + 1}">\n${ev.xml}\n  </evento>`)
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<eSocial xmlns="http://www.esocial.gov.br/schema/lote/eventos/envio/v1_1_1">',
    '  <envioLoteEventos grupo="1">',
    "    <ideEmpregador>",
    "      <tpInsc>1</tpInsc>",
    `      <nrInsc>${c.substring(0, 8)}</nrInsc>`,
    "    </ideEmpregador>",
    "    <ideTransmissor>",
    "      <tpInsc>1</tpInsc>",
    `      <nrInsc>${c}</nrInsc>`,
    "    </ideTransmissor>",
    "    <eventos>",
    eventsXml,
    "    </eventos>",
    "  </envioLoteEventos>",
    "</eSocial>",
  ].join("\n");
}

// ─── Transmissão HTTP (mTLS) ao gateway ──────────────────────────────────────
function postarLote(
  url: string,
  loteXml: string,
  pfxBuffer: Buffer,
  senha: string,
  ambiente: "1" | "2"
): Promise<string> {
  return new Promise((resolve, reject) => {
    const body = Buffer.from(loteXml, "utf8");
    const u = new URL(url);

    const options: https.RequestOptions = {
      hostname: u.hostname,
      port: u.port ? parseInt(u.port) : 443,
      path: u.pathname,
      method: "POST",
      pfx: pfxBuffer,
      passphrase: senha,
      // Em produção (ambiente "1") valida o certificado do servidor; em homologação aceita auto-assinado
      rejectUnauthorized: ambiente === "1",
      headers: {
        "Content-Type": "application/xml; charset=UTF-8",
        "Content-Length": body.length,
        "User-Agent": "DPMasterPro/1.0 (eSocial S-1.3)",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => resolve(data));
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

export interface ResultadoTransmissao {
  protocolo: string;
  descricao: string;
  cdResposta: string;
  xmlRetorno: string;
  modoDemo: boolean;
}

// ─── Transmitir eventos pendentes ─────────────────────────────────────────────
// Se pfxBase64 for fornecido → assina e transmite de verdade.
// Caso contrário → modo demo: gera protocolo local e simula sucesso.
export async function transmitirEventos(
  eventos: Array<{ id: string; xml: string }>,
  cnpj: string,
  ambiente: "1" | "2",
  pfxBase64?: string,
  senha?: string
): Promise<ResultadoTransmissao> {

  if (!pfxBase64 || !senha) {
    // ── MODO DEMO ─────────────────────────────────────────────────────────────
    const protocolo = gerarProtocoloDemo();
    const xmlRetorno = montarRetornoDemo(protocolo, eventos.length);
    return {
      protocolo,
      descricao: "Lote recebido com sucesso! [MODO DEMONSTRAÇÃO — sem certificado]",
      cdResposta: "201",
      xmlRetorno,
      modoDemo: true,
    };
  }

  // ── MODO REAL ───────────────────────────────────────────────────────────────
  // 1. Assinar cada evento
  const eventosAssinados = eventos.map((ev) => ({
    id: ev.id,
    xml: assinarEvento(ev.xml, pfxBase64, senha),
  }));

  // 2. Montar lote
  const loteXml = montarLote(eventosAssinados, cnpj);

  // 3. Transmitir
  const pfxBuffer = Buffer.from(pfxBase64, "base64");
  const xmlRetorno = await postarLote(GATEWAY[ambiente], loteXml, pfxBuffer, senha, ambiente);

  // 4. Parsear resposta
  const cdMatch = xmlRetorno.match(/<cdResposta>(\d+)<\/cdResposta>/);
  const descMatch = xmlRetorno.match(/<descResposta>([^<]+)<\/descResposta>/);
  const protMatch = xmlRetorno.match(/<nrRec>([^<]+)<\/nrRec>/);

  const cdResposta = cdMatch?.[1] ?? "000";
  const descricao = descMatch?.[1] ?? "Sem descrição";
  const protocolo = protMatch?.[1] ?? "";

  if (cdResposta !== "201" && cdResposta !== "200") {
    throw new Error(`Gateway rejeitou o lote [${cdResposta}]: ${descricao}`);
  }

  return { protocolo, descricao, cdResposta, xmlRetorno, modoDemo: false };
}

// ─── Consultar status de protocolo ────────────────────────────────────────────
export async function consultarProtocolo(
  protocolo: string,
  cnpj: string,
  ambiente: "1" | "2",
  pfxBase64?: string,
  senha?: string
): Promise<{ situacao: string; descricao: string; xmlRetorno: string }> {

  if (!pfxBase64 || !senha) {
    // Demo
    return {
      situacao: "10",
      descricao: "Processado com sucesso [MODO DEMONSTRAÇÃO]",
      xmlRetorno: montarRetornoConsultaDemo(protocolo),
    };
  }

  const url = ambiente === "1"
    ? `https://esocial.gov.br/servicos/empregador/evento/consultaLoteEventos/v1_1_0?nrRec=${encodeURIComponent(protocolo)}`
    : `https://ehr.esocial.gov.br/servicos/empregador/evento/consultaLoteEventos/v1_1_0?nrRec=${encodeURIComponent(protocolo)}`;

  const pfxBuffer = Buffer.from(pfxBase64, "base64");
  const xmlRetorno = await postarLote(url, "", pfxBuffer, senha, ambiente);

  const sitMatch = xmlRetorno.match(/<cdSitEvt>(\w+)<\/cdSitEvt>/);
  const descMatch = xmlRetorno.match(/<descSit>([^<]+)<\/descSit>/);

  return {
    situacao: sitMatch?.[1] ?? "00",
    descricao: descMatch?.[1] ?? "Sem informação",
    xmlRetorno,
  };
}

// ─── Helpers internos ─────────────────────────────────────────────────────────
function gerarProtocoloDemo(): string {
  const dt = new Date();
  const ano = dt.getFullYear();
  const mes = String(dt.getMonth() + 1).padStart(2, "0");
  const seq = String(Date.now()).slice(-10);
  return `${ano}.${mes}.${seq}`;
}

function montarRetornoDemo(protocolo: string, qtd: number): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<eSocial xmlns="http://www.esocial.gov.br/schema/lote/eventos/envio/retornoSincrono/v1_3_0">',
    "  <retornoEnvioLoteEventos>",
    "    <retornoLote>",
    `      <tmTrans>${new Date().toISOString()}</tmTrans>`,
    "      <status>",
    "        <cdResposta>201</cdResposta>",
    `        <descResposta>Lote com ${qtd} evento(s) recebido com sucesso! [MODO DEMONSTRAÇÃO]</descResposta>`,
    `        <nrRec>${protocolo}</nrRec>`,
    "      </status>",
    "    </retornoLote>",
    "  </retornoEnvioLoteEventos>",
    "</eSocial>",
  ].join("\n");
}

function montarRetornoConsultaDemo(protocolo: string): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<eSocial xmlns="http://www.esocial.gov.br/schema/lote/retornoProcessamentoLoteEventos/v1_3_0">',
    "  <retornoProcessamentoLoteEventos>",
    `    <nrRec>${protocolo}</nrRec>`,
    `    <tmTrans>${new Date().toISOString()}</tmTrans>`,
    `    <tmProc>${new Date().toISOString()}</tmProc>`,
    "    <retornoEventos>",
    "      <evento>",
    "        <retornoEvento>",
    "          <recepcaoEvento>",
    "            <situacao>",
    "              <cdSitEvt>10</cdSitEvt>",
    "              <descSit>Processado com sucesso [MODO DEMONSTRAÇÃO]</descSit>",
    "            </situacao>",
    "          </recepcaoEvento>",
    "        </retornoEvento>",
    "      </evento>",
    "    </retornoEventos>",
    "  </retornoProcessamentoLoteEventos>",
    "</eSocial>",
  ].join("\n");
}
