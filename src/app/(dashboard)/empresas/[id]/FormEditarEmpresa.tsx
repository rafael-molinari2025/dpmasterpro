"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, Save, ShieldCheck, ShieldOff, Upload, Eye, EyeOff,
  CheckCircle, AlertCircle, Info, Trash2, Lock,
} from "lucide-react";

interface CertInfo {
  configurado: boolean;
  validade: string | null;
  titular: string | null;
}

interface Empresa {
  id: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  cnpj: string;
  inscEstadual: string | null;
  inscMunicipal: string | null;
  cnae: string | null;
  naturezaJuridica: string | null;
  regimeTributario: string;
  recolheINSSPatronal: boolean;
  aliquotaRAT: number | string;
  fatorMEI: number | string;
  responsavelNome: string | null;
  responsavelCPF: string | null;
  email: string | null;
  telefone: string | null;
  endereco: Record<string, string> | null;
  certificadoDigital: CertInfo | null;
  ativa: boolean;
}

interface Props {
  empresa: Empresa;
}

type Tab = "dados" | "esocial";

export default function FormEditarEmpresa({ empresa }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<Tab>("dados");
  const [salvando, setSalvando] = useState(false);
  const [resultado, setResultado] = useState<{ tipo: "sucesso" | "erro"; msg: string } | null>(null);

  // Dados gerais
  const [form, setForm] = useState({
    razaoSocial: empresa.razaoSocial,
    nomeFantasia: empresa.nomeFantasia ?? "",
    inscEstadual: empresa.inscEstadual ?? "",
    inscMunicipal: empresa.inscMunicipal ?? "",
    cnae: empresa.cnae ?? "",
    naturezaJuridica: empresa.naturezaJuridica ?? "",
    regimeTributario: empresa.regimeTributario,
    recolheINSSPatronal: empresa.recolheINSSPatronal,
    aliquotaRAT: String(empresa.aliquotaRAT ?? "1.0"),
    fatorMEI: String(empresa.fatorMEI ?? "1.0"),
    responsavelNome: empresa.responsavelNome ?? "",
    responsavelCPF: empresa.responsavelCPF ?? "",
    email: empresa.email ?? "",
    telefone: empresa.telefone ?? "",
    // Endereço
    logradouro: empresa.endereco?.logradouro ?? "",
    numero: empresa.endereco?.numero ?? "",
    complemento: empresa.endereco?.complemento ?? "",
    bairro: empresa.endereco?.bairro ?? "",
    municipio: empresa.endereco?.municipio ?? "",
    uf: empresa.endereco?.uf ?? "",
    cep: empresa.endereco?.cep ?? "",
    ativa: empresa.ativa,
  });

  // Certificado
  const [certInfo, setCertInfo] = useState<CertInfo | null>(empresa.certificadoDigital);
  const [novoCertBase64, setNovoCertBase64] = useState<string | null>(null);
  const [novoCertNome, setNovoCertNome] = useState<string | null>(null);
  const [certSenha, setCertSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [removerCert, setRemoverCert] = useState(false);

  function field(key: keyof typeof form) {
    return {
      value: String(form[key]),
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value })),
    };
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = (ev.target?.result as string).split(",")[1];
      setNovoCertBase64(base64);
      setNovoCertNome(file.name);
      setRemoverCert(false);
      setCertSenha("");
    };
    reader.readAsDataURL(file);
  }

  async function salvar() {
    setSalvando(true);
    setResultado(null);
    try {
      const payload: Record<string, unknown> = {
        ...form,
        endereco: {
          logradouro: form.logradouro,
          numero: form.numero,
          complemento: form.complemento,
          bairro: form.bairro,
          municipio: form.municipio,
          uf: form.uf,
          cep: form.cep,
        },
      };
      // Remover campos de endereço avulsos
      ["logradouro","numero","complemento","bairro","municipio","uf","cep"].forEach(k => delete payload[k]);

      if (removerCert) {
        payload.certificadoRemover = true;
      } else if (novoCertBase64 && certSenha) {
        payload.certificadoPfxBase64 = novoCertBase64;
        payload.certificadoSenha = certSenha;
      }

      const res = await fetch(`/api/empresas/${empresa.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setResultado({ tipo: "erro", msg: data.error ?? "Erro ao salvar." });
      } else {
        setCertInfo(data.certificadoDigital ?? null);
        setNovoCertBase64(null);
        setNovoCertNome(null);
        setCertSenha("");
        setRemoverCert(false);
        setResultado({ tipo: "sucesso", msg: "Empresa atualizada com sucesso!" });
        router.refresh();
      }
    } catch {
      setResultado({ tipo: "erro", msg: "Erro de conexão." });
    } finally {
      setSalvando(false);
    }
  }

  const certValida = certInfo?.configurado && certInfo.validade
    ? new Date(certInfo.validade + "T23:59:59") >= new Date()
    : false;

  const certVencida = certInfo?.configurado && certInfo.validade
    ? new Date(certInfo.validade + "T23:59:59") < new Date()
    : false;

  return (
    <div className="max-w-4xl">
      {/* Abas */}
      <div className="flex border-b border-gray-200 mb-6 gap-0">
        {[
          { key: "dados", label: "Dados da Empresa", icon: Building2 },
          { key: "esocial", label: "Certificado Digital / eSocial", icon: ShieldCheck },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as Tab)}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === key
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ── ABA: DADOS ─────────────────────────────────────────────────────── */}
      {tab === "dados" && (
        <div className="space-y-6">
          {/* Identificação */}
          <section className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 space-y-4">
            <h2 className="font-semibold text-gray-800">Identificação</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Razão Social *</label>
                <input className="input" {...field("razaoSocial")} />
              </div>
              <div>
                <label className="label">Nome Fantasia</label>
                <input className="input" {...field("nomeFantasia")} />
              </div>
              <div>
                <label className="label">CNPJ</label>
                <input className="input bg-gray-50 cursor-not-allowed" value={empresa.cnpj} readOnly />
              </div>
              <div>
                <label className="label">Insc. Estadual</label>
                <input className="input" {...field("inscEstadual")} />
              </div>
              <div>
                <label className="label">Insc. Municipal</label>
                <input className="input" {...field("inscMunicipal")} />
              </div>
              <div>
                <label className="label">CNAE Principal</label>
                <input className="input" placeholder="ex: 6920601" {...field("cnae")} />
              </div>
              <div>
                <label className="label">Natureza Jurídica</label>
                <input className="input" placeholder="ex: 2062" {...field("naturezaJuridica")} />
              </div>
            </div>
          </section>

          {/* Tributação */}
          <section className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 space-y-4">
            <h2 className="font-semibold text-gray-800">Tributação</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label">Regime Tributário</label>
                <select className="input" {...field("regimeTributario")}>
                  <option value="SIMPLES_NACIONAL">Simples Nacional</option>
                  <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
                  <option value="LUCRO_REAL">Lucro Real</option>
                  <option value="MEI">MEI</option>
                </select>
              </div>
              <div>
                <label className="label">Alíquota RAT (%)</label>
                <input className="input" type="number" step="0.1" min="0" max="4" {...field("aliquotaRAT")} />
              </div>
              <div>
                <label className="label">Fator MEI</label>
                <input className="input" type="number" step="0.01" min="0" {...field("fatorMEI")} />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="recolheINSS"
                  checked={form.recolheINSSPatronal}
                  onChange={(e) => setForm((f) => ({ ...f, recolheINSSPatronal: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600"
                />
                <label htmlFor="recolheINSS" className="text-sm text-gray-700">Recolhe INSS Patronal</label>
              </div>
            </div>
          </section>

          {/* Responsável */}
          <section className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 space-y-4">
            <h2 className="font-semibold text-gray-800">Responsável e Contato</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Nome do Responsável</label>
                <input className="input" {...field("responsavelNome")} />
              </div>
              <div>
                <label className="label">CPF do Responsável</label>
                <input className="input" placeholder="000.000.000-00" {...field("responsavelCPF")} />
              </div>
              <div>
                <label className="label">E-mail</label>
                <input className="input" type="email" {...field("email")} />
              </div>
              <div>
                <label className="label">Telefone</label>
                <input className="input" placeholder="(00) 00000-0000" {...field("telefone")} />
              </div>
            </div>
          </section>

          {/* Endereço */}
          <section className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 space-y-4">
            <h2 className="font-semibold text-gray-800">Endereço</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Logradouro</label>
                <input className="input" {...field("logradouro")} />
              </div>
              <div>
                <label className="label">Número</label>
                <input className="input" {...field("numero")} />
              </div>
              <div>
                <label className="label">Complemento</label>
                <input className="input" {...field("complemento")} />
              </div>
              <div>
                <label className="label">Bairro</label>
                <input className="input" {...field("bairro")} />
              </div>
              <div>
                <label className="label">CEP</label>
                <input className="input" placeholder="00000-000" {...field("cep")} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Município</label>
                <input className="input" {...field("municipio")} />
              </div>
              <div>
                <label className="label">UF</label>
                <input className="input" maxLength={2} placeholder="SP" {...field("uf")} />
              </div>
            </div>
          </section>

          {/* Status */}
          <section className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="ativa"
                checked={form.ativa}
                onChange={(e) => setForm((f) => ({ ...f, ativa: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-blue-600"
              />
              <label htmlFor="ativa" className="text-sm text-gray-700 font-medium">Empresa ativa</label>
            </div>
          </section>
        </div>
      )}

      {/* ── ABA: CERTIFICADO ───────────────────────────────────────────────── */}
      {tab === "esocial" && (
        <div className="space-y-5">
          {/* Status atual */}
          <section className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Status do Certificado Digital A1</h2>

            {certInfo?.configurado ? (
              <div className={`rounded-lg border p-4 ${certVencida ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
                <div className="flex items-center gap-2 mb-2">
                  {certVencida
                    ? <AlertCircle className="w-5 h-5 text-red-600" />
                    : <ShieldCheck className="w-5 h-5 text-green-700" />}
                  <span className={`font-semibold text-sm ${certVencida ? "text-red-700" : "text-green-800"}`}>
                    {certVencida ? "Certificado vencido" : "Certificado configurado"}
                  </span>
                </div>
                {certInfo.titular && (
                  <p className="text-sm text-gray-700"><strong>Titular:</strong> {certInfo.titular}</p>
                )}
                {certInfo.validade && (
                  <p className={`text-sm mt-1 ${certVencida ? "text-red-700 font-medium" : "text-gray-600"}`}>
                    <strong>Válido até:</strong>{" "}
                    {new Date(certInfo.validade + "T12:00:00").toLocaleDateString("pt-BR")}
                    {certVencida && " — VENCIDO"}
                  </p>
                )}
                <button
                  onClick={() => { setRemoverCert(true); setNovoCertBase64(null); setNovoCertNome(null); }}
                  disabled={removerCert}
                  className="mt-3 flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800 disabled:opacity-40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {removerCert ? "Será removido ao salvar" : "Remover certificado"}
                </button>
                {removerCert && (
                  <button
                    onClick={() => setRemoverCert(false)}
                    className="mt-1 text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    Cancelar remoção
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
                <ShieldOff className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Nenhum certificado configurado</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    O sistema opera em <strong>modo demonstração</strong>. Configure o certificado A1 para transmissão real ao eSocial.
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Upload novo certificado */}
          {!removerCert && (
            <section className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 space-y-5">
              <h2 className="font-semibold text-gray-800">
                {certInfo?.configurado ? "Substituir Certificado" : "Configurar Certificado Digital"}
              </h2>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-800 space-y-1">
                  <p>Use o certificado digital A1 (arquivo <code className="font-mono bg-blue-100 px-1 rounded">.pfx</code> ou <code className="font-mono bg-blue-100 px-1 rounded">.p12</code>) da empresa.</p>
                  <p>O arquivo é convertido para Base64 e armazenado de forma criptografada. A senha fica associada ao certificado.</p>
                  <p>Certifique-se de que o certificado está dentro da validade e habilitado para o eSocial.</p>
                </div>
              </div>

              {/* Área de upload */}
              <div>
                <label className="label">Arquivo do Certificado (.pfx / .p12)</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className={`mt-1 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                    novoCertBase64
                      ? "border-green-400 bg-green-50"
                      : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                  }`}
                >
                  {novoCertBase64 ? (
                    <div className="flex flex-col items-center gap-2 text-green-700">
                      <CheckCircle className="w-8 h-8" />
                      <p className="text-sm font-medium">{novoCertNome}</p>
                      <p className="text-xs text-green-600">Arquivo carregado — insira a senha abaixo</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Upload className="w-8 h-8" />
                      <p className="text-sm font-medium text-gray-600">Clique para selecionar o arquivo</p>
                      <p className="text-xs">Formatos aceitos: .pfx, .p12</p>
                    </div>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pfx,.p12"
                    className="hidden"
                    onChange={onFileChange}
                  />
                </div>
              </div>

              {/* Senha */}
              {novoCertBase64 && (
                <div>
                  <label className="label">Senha do Certificado *</label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={mostrarSenha ? "text" : "password"}
                      value={certSenha}
                      onChange={(e) => setCertSenha(e.target.value)}
                      placeholder="Senha do arquivo .pfx"
                      className="input pl-9 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">
                    A senha é armazenada junto ao certificado e usada nas transmissões eSocial.
                  </p>
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {/* Feedback + Botão Salvar */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          onClick={salvar}
          disabled={salvando}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Save className={`w-4 h-4 ${salvando ? "animate-pulse" : ""}`} />
          {salvando ? "Salvando…" : "Salvar Alterações"}
        </button>

        {resultado && (
          <div className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg border ${
            resultado.tipo === "sucesso"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}>
            {resultado.tipo === "sucesso"
              ? <CheckCircle className="w-4 h-4" />
              : <AlertCircle className="w-4 h-4" />}
            {resultado.msg}
          </div>
        )}
      </div>

      <style jsx>{`
        .label { display: block; font-size: 0.75rem; font-weight: 500; color: #374151; margin-bottom: 4px; }
        .input { width: 100%; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 0.5rem 0.75rem; font-size: 0.875rem; background: white; outline: none; }
        .input:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.2); }
      `}</style>
    </div>
  );
}
