"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, AlertCircle, Upload, CheckCircle, Lock, Eye, EyeOff, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";

const label = "block text-xs font-medium text-gray-600 mb-1";
const input = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

const UFS = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

export default function FormNovaEmpresa() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Certificado
  const [mostrarCert, setMostrarCert] = useState(false);
  const [certBase64, setCertBase64] = useState<string | null>(null);
  const [certNome, setCertNome] = useState<string | null>(null);
  const [certSenha, setCertSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = (ev.target?.result as string).split(",")[1];
      setCertBase64(base64);
      setCertNome(file.name);
      setCertSenha("");
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const g = (k: string) => (fd.get(k) as string) ?? "";
    const strip = (v: string) => v.replace(/\D/g, "");

    const body: Record<string, unknown> = {
      razaoSocial: g("razaoSocial"),
      cnpj: strip(g("cnpj")),
      regimeTributario: g("regimeTributario") || "LUCRO_PRESUMIDO",
      recolheINSSPatronal: g("recolheINSSPatronal") === "true",
      aliquotaRAT: parseFloat(g("aliquotaRAT")) || 1.0,
      ativa: true,
    };

    if (g("nomeFantasia")) body.nomeFantasia = g("nomeFantasia");
    if (g("inscEstadual")) body.inscEstadual = g("inscEstadual");
    if (g("inscMunicipal")) body.inscMunicipal = g("inscMunicipal");
    if (g("cnae")) body.cnae = g("cnae");
    if (g("naturezaJuridica")) body.naturezaJuridica = g("naturezaJuridica");
    if (g("responsavelNome")) body.responsavelNome = g("responsavelNome");
    if (strip(g("responsavelCPF"))) body.responsavelCPF = strip(g("responsavelCPF"));
    if (g("email")) body.email = g("email");
    if (strip(g("telefone"))) body.telefone = strip(g("telefone"));

    if (g("endLogradouro") || g("endCidade")) {
      body.endereco = {
        cep: strip(g("endCEP")),
        logradouro: g("endLogradouro"),
        numero: g("endNumero"),
        complemento: g("endComplemento"),
        bairro: g("endBairro"),
        cidade: g("endCidade"),
        uf: g("endUF"),
      };
    }

    if (certBase64 && certSenha) {
      body.certificadoPfxBase64 = certBase64;
      body.certificadoSenha = certSenha;
    }

    try {
      const res = await fetch("/api/empresas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao cadastrar empresa");
        setLoading(false);
        return;
      }
      router.push("/empresas");
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-4">
          <a href="/empresas" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-4 h-4" />
            Voltar para empresas
          </a>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Dados Principais */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Dados da Empresa</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={label}>Razão Social *</label>
                <input type="text" name="razaoSocial" required className={input} placeholder="Razão Social da empresa" />
              </div>
              <div>
                <label className={label}>Nome Fantasia</label>
                <input type="text" name="nomeFantasia" className={input} placeholder="Nome fantasia (opcional)" />
              </div>
              <div>
                <label className={label}>CNPJ *</label>
                <input type="text" name="cnpj" required className={input} placeholder="00.000.000/0000-00" maxLength={18} />
              </div>
              <div>
                <label className={label}>Inscrição Estadual</label>
                <input type="text" name="inscEstadual" className={input} placeholder="IE" />
              </div>
              <div>
                <label className={label}>Inscrição Municipal</label>
                <input type="text" name="inscMunicipal" className={input} placeholder="IM" />
              </div>
              <div>
                <label className={label}>CNAE Principal</label>
                <input type="text" name="cnae" className={input} placeholder="0000-0/00" />
              </div>
              <div>
                <label className={label}>Natureza Jurídica</label>
                <input type="text" name="naturezaJuridica" className={input} placeholder="Ex: 2062 - Sociedade Ltda." />
              </div>
              <div>
                <label className={label}>Regime Tributário *</label>
                <select name="regimeTributario" required className={input} defaultValue="LUCRO_PRESUMIDO">
                  <option value="SIMPLES_NACIONAL">Simples Nacional</option>
                  <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
                  <option value="LUCRO_REAL">Lucro Real</option>
                  <option value="MEI">MEI</option>
                </select>
              </div>
              <div>
                <label className={label}>Recolhe INSS Patronal</label>
                <select name="recolheINSSPatronal" className={input} defaultValue="true">
                  <option value="true">Sim</option>
                  <option value="false">Não (Simples / MEI)</option>
                </select>
              </div>
              <div>
                <label className={label}>Alíquota RAT (%)</label>
                <input type="number" name="aliquotaRAT" step="0.01" min="0" max="3" defaultValue="1.00" className={input} />
              </div>
            </div>
          </div>

          {/* Responsável */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Responsável e Contato</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={label}>Nome do Responsável</label>
                <input type="text" name="responsavelNome" className={input} placeholder="Nome completo" />
              </div>
              <div>
                <label className={label}>CPF do Responsável</label>
                <input type="text" name="responsavelCPF" className={input} placeholder="000.000.000-00" maxLength={14} />
              </div>
              <div>
                <label className={label}>E-mail</label>
                <input type="email" name="email" className={input} placeholder="contato@empresa.com" />
              </div>
              <div>
                <label className={label}>Telefone</label>
                <input type="text" name="telefone" className={input} placeholder="(00) 0000-0000" maxLength={15} />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Endereço</h2>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className={label}>CEP</label>
                <input type="text" name="endCEP" className={input} placeholder="00000-000" maxLength={9} />
              </div>
              <div className="col-span-2">
                <label className={label}>Logradouro</label>
                <input type="text" name="endLogradouro" className={input} placeholder="Rua, Av., etc." />
              </div>
              <div>
                <label className={label}>Número</label>
                <input type="text" name="endNumero" className={input} placeholder="Nº" />
              </div>
              <div className="col-span-2">
                <label className={label}>Complemento</label>
                <input type="text" name="endComplemento" className={input} placeholder="Sala, Andar, etc." />
              </div>
              <div>
                <label className={label}>Bairro</label>
                <input type="text" name="endBairro" className={input} placeholder="Bairro" />
              </div>
              <div>
                <label className={label}>Cidade</label>
                <input type="text" name="endCidade" className={input} placeholder="Cidade" />
              </div>
              <div>
                <label className={label}>UF</label>
                <select name="endUF" className={input} defaultValue="">
                  <option value="">UF</option>
                  {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Certificado Digital (opcional) */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setMostrarCert((v) => !v)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-semibold text-gray-800">Certificado Digital A1</span>
                <span className="text-xs text-gray-400 font-normal">(opcional — pode ser adicionado depois)</span>
              </div>
              {mostrarCert ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {mostrarCert && (
              <div className="px-5 pb-5 space-y-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 pt-4">
                  Importe o certificado A1 (<code className="font-mono bg-gray-100 px-1 rounded">.pfx</code> ou <code className="font-mono bg-gray-100 px-1 rounded">.p12</code>) da empresa. Necessário para transmissão real ao eSocial.
                </p>

                {/* Área de upload */}
                <div
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
                    certBase64
                      ? "border-green-400 bg-green-50"
                      : "border-gray-300 hover:border-amber-400 hover:bg-amber-50"
                  }`}
                >
                  {certBase64 ? (
                    <div className="flex flex-col items-center gap-1.5 text-green-700">
                      <CheckCircle className="w-7 h-7" />
                      <p className="text-sm font-medium">{certNome}</p>
                      <p className="text-xs text-green-600">Arquivo carregado — insira a senha abaixo</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-gray-400">
                      <Upload className="w-7 h-7" />
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

                {/* Senha */}
                {certBase64 && (
                  <div>
                    <label className={label}>Senha do Certificado *</label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={mostrarSenha ? "text" : "password"}
                        value={certSenha}
                        onChange={(e) => setCertSenha(e.target.value)}
                        placeholder="Senha do arquivo .pfx"
                        className={`${input} pl-9 pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarSenha((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-3 pb-6">
            <a
              href="/empresas"
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </a>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              {loading ? "Salvando..." : "Cadastrar Empresa"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
