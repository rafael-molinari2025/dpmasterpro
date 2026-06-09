"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, AlertCircle, RefreshCw } from "lucide-react";

interface Empresa { id: string; nomeFantasia: string | null; razaoSocial: string; }
interface Cargo { id: string; empresaId: string; descricao: string; codigo: string; salarioBase: number; }
interface Setor { id: string; empresaId: string; descricao: string; codigo: string; }

interface Props {
  empresas: Empresa[];
  cargos: Cargo[];
  setores: Setor[];
}

const UFS = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

const label = "block text-xs font-medium text-gray-600 mb-1";
const input = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

export default function FormNovoFuncionario({ empresas, cargos, setores }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [empresaId, setEmpresaId] = useState(empresas[0]?.id ?? "");
  const [matricula, setMatricula] = useState("");
  const [buscandoMatricula, setBuscandoMatricula] = useState(false);

  const cargosFiltrados = cargos.filter((c) => c.empresaId === empresaId);
  const setoresFiltrados = setores.filter((s) => s.empresaId === empresaId);

  const buscarProximaMatricula = useCallback(async (eId: string) => {
    if (!eId) return;
    setBuscandoMatricula(true);
    try {
      const res = await fetch(`/api/funcionarios/proxima-matricula?empresaId=${eId}`);
      if (res.ok) {
        const { proxima } = await res.json();
        setMatricula(proxima);
      }
    } catch { /* silencioso */ }
    finally { setBuscandoMatricula(false); }
  }, []);

  useEffect(() => {
    buscarProximaMatricula(empresaId);
  }, [empresaId, buscarProximaMatricula]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const g = (k: string) => (fd.get(k) as string) ?? "";
    const strip = (v: string) => v.replace(/\D/g, "");

    const body: Record<string, unknown> = {
      empresaId,
      matricula: matricula.trim() || g("matricula"),
      nome: g("nome"),
      cpf: strip(g("cpf")),
      dataNascimento: new Date(g("dataNascimento")).toISOString(),
      sexo: g("sexo"),
      estadoCivil: g("estadoCivil") || "SOLTEIRO",
      tipoContrato: g("tipoContrato") || "CLT",
      dataAdmissao: new Date(g("dataAdmissao")).toISOString(),
      salario: parseFloat(g("salario")),
      jornadaHoras: parseInt(g("jornadaHoras")) || 220,
      tipoJornada: g("tipoJornada") || "MENSAL",
      categoriaESocial: g("categoriaESocial") || "101",
      nacionalidade: g("nacionalidade") || "Brasileiro",
    };

    if (g("rg")) { body.rg = g("rg"); body.rgOrgao = g("rgOrgao"); body.rgUF = g("rgUF"); }
    if (g("cargoId")) body.cargoId = g("cargoId");
    if (g("setorId")) body.setorId = g("setorId");
    if (g("email")) body.email = g("email");
    if (strip(g("celular"))) body.celular = strip(g("celular"));
    if (strip(g("telefone"))) body.telefone = strip(g("telefone"));
    if (strip(g("pisPasep"))) body.pisPasep = strip(g("pisPasep"));
    if (g("ctps")) { body.ctps = g("ctps"); body.ctpsSerie = g("ctpsSerie"); body.ctpsUF = g("ctpsUF"); }
    if (g("banco")) { body.banco = g("banco"); body.agencia = g("agencia"); body.conta = g("conta"); body.tipoConta = g("tipoConta"); }
    if (g("naturalidade")) body.naturalidade = g("naturalidade");
    if (g("escolaridade")) body.escolaridade = g("escolaridade");

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

    try {
      const res = await fetch("/api/funcionarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao cadastrar funcionário");
        setLoading(false);
        return;
      }
      router.push("/funcionarios");
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <a href="/funcionarios" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-4 h-4" />
            Voltar para funcionários
          </a>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Empresa e Matrícula */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Empresa e Vínculo</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className={label}>Empresa *</label>
                <select
                  name="empresaId"
                  value={empresaId}
                  onChange={(e) => setEmpresaId(e.target.value)}
                  required
                  className={input}
                >
                  <option value="">Selecione a empresa...</option>
                  {empresas.map((e) => (
                    <option key={e.id} value={e.id}>{e.nomeFantasia ?? e.razaoSocial}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label}>
                  Matrícula *{" "}
                  <span className="font-normal text-gray-400">(única por empresa)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="matricula"
                    required
                    value={matricula}
                    onChange={(e) => setMatricula(e.target.value)}
                    className={`${input} pr-8 font-mono`}
                    placeholder="00001"
                  />
                  <button
                    type="button"
                    title="Sugerir próxima matrícula"
                    onClick={() => buscarProximaMatricula(empresaId)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${buscandoMatricula ? "animate-spin" : ""}`} />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">Preenchida automaticamente com o próximo número disponível</p>
              </div>
              <div>
                <label className={label}>Tipo de Contrato *</label>
                <select name="tipoContrato" required className={input} defaultValue="CLT">
                  <option value="CLT">CLT</option>
                  <option value="EXPERIENCIA">Experiência</option>
                  <option value="TEMPORARIO">Temporário</option>
                  <option value="ESTAGIO">Estágio</option>
                  <option value="JOVEM_APRENDIZ">Jovem Aprendiz</option>
                  <option value="PJ">PJ</option>
                </select>
              </div>
              <div>
                <label className={label}>Data de Admissão *</label>
                <input type="date" name="dataAdmissao" required className={input} />
              </div>
              <div>
                <label className={label}>Salário (R$) *</label>
                <input type="number" name="salario" required step="0.01" min="0.01" className={input} placeholder="0,00" />
              </div>
            </div>
          </div>

          {/* Dados Pessoais */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Dados Pessoais</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-3">
                <label className={label}>Nome Completo *</label>
                <input type="text" name="nome" required className={input} placeholder="Nome completo do funcionário" />
              </div>
              <div>
                <label className={label}>CPF *</label>
                <input type="text" name="cpf" required className={input} placeholder="000.000.000-00" maxLength={14} />
              </div>
              <div>
                <label className={label}>Data de Nascimento *</label>
                <input type="date" name="dataNascimento" required className={input} />
              </div>
              <div>
                <label className={label}>Sexo *</label>
                <select name="sexo" required className={input} defaultValue="">
                  <option value="">Selecione...</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
              </div>
              <div>
                <label className={label}>Estado Civil</label>
                <select name="estadoCivil" className={input} defaultValue="SOLTEIRO">
                  <option value="SOLTEIRO">Solteiro(a)</option>
                  <option value="CASADO">Casado(a)</option>
                  <option value="DIVORCIADO">Divorciado(a)</option>
                  <option value="VIUVO">Viúvo(a)</option>
                  <option value="UNIAO_ESTAVEL">União Estável</option>
                </select>
              </div>
              <div>
                <label className={label}>Escolaridade</label>
                <select name="escolaridade" className={input} defaultValue="">
                  <option value="">Não informado</option>
                  <option value="FUNDAMENTAL_INCOMPLETO">Fund. Incompleto</option>
                  <option value="FUNDAMENTAL_COMPLETO">Fund. Completo</option>
                  <option value="MEDIO_INCOMPLETO">Médio Incompleto</option>
                  <option value="MEDIO_COMPLETO">Médio Completo</option>
                  <option value="SUPERIOR_INCOMPLETO">Superior Incompleto</option>
                  <option value="SUPERIOR_COMPLETO">Superior Completo</option>
                  <option value="POS_GRADUACAO">Pós-Graduação</option>
                  <option value="MESTRADO">Mestrado</option>
                  <option value="DOUTORADO">Doutorado</option>
                </select>
              </div>
              <div>
                <label className={label}>Naturalidade</label>
                <input type="text" name="naturalidade" className={input} placeholder="Cidade natal" />
              </div>
              <div>
                <label className={label}>Nacionalidade</label>
                <input type="text" name="nacionalidade" className={input} defaultValue="Brasileiro" />
              </div>
              <div>
                <label className={label}>RG</label>
                <input type="text" name="rg" className={input} placeholder="Número do RG" />
              </div>
              <div>
                <label className={label}>Órgão Emissor</label>
                <input type="text" name="rgOrgao" className={input} placeholder="Ex: SSP" />
              </div>
              <div>
                <label className={label}>UF do RG</label>
                <select name="rgUF" className={input} defaultValue="">
                  <option value="">UF</option>
                  {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Contato */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Contato</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className={label}>E-mail</label>
                <input type="email" name="email" className={input} placeholder="email@exemplo.com" />
              </div>
              <div>
                <label className={label}>Celular</label>
                <input type="text" name="celular" className={input} placeholder="(00) 9 0000-0000" maxLength={16} />
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
                <input type="text" name="endComplemento" className={input} placeholder="Apto, Bloco, etc." />
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

          {/* Dados Trabalhistas */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Cargo, Setor e Jornada</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={label}>Cargo</label>
                <select name="cargoId" className={input} defaultValue="">
                  <option value="">Sem cargo</option>
                  {cargosFiltrados.map((c) => (
                    <option key={c.id} value={c.id}>{c.descricao} ({c.codigo})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label}>Setor</label>
                <select name="setorId" className={input} defaultValue="">
                  <option value="">Sem setor</option>
                  {setoresFiltrados.map((s) => (
                    <option key={s.id} value={s.id}>{s.descricao} ({s.codigo})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label}>Jornada (horas/mês)</label>
                <input type="number" name="jornadaHoras" defaultValue="220" min="1" max="240" className={input} />
              </div>
              <div>
                <label className={label}>Tipo de Jornada</label>
                <select name="tipoJornada" className={input} defaultValue="MENSAL">
                  <option value="MENSAL">Mensal</option>
                  <option value="SEMANAL">Semanal</option>
                  <option value="HORISTA">Horista</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className={label}>Categoria eSocial</label>
                <select name="categoriaESocial" className={input} defaultValue="101">
                  <option value="101">101 — Empregado Geral CLT</option>
                  <option value="102">102 — Empregado Doméstico</option>
                  <option value="103">103 — Trabalhador Avulso</option>
                  <option value="105">105 — Aprendiz</option>
                  <option value="106">106 — Estagiário</option>
                  <option value="111">111 — Contribuinte Individual / Autônomo</option>
                  <option value="301">301 — Servidor Público Efetivo</option>
                  <option value="901">901 — Estagiário (Lei 11.788/08)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Documentos */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Documentos</h2>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className={label}>CTPS</label>
                <input type="text" name="ctps" className={input} placeholder="Número" />
              </div>
              <div>
                <label className={label}>Série CTPS</label>
                <input type="text" name="ctpsSerie" className={input} placeholder="Série" />
              </div>
              <div>
                <label className={label}>UF CTPS</label>
                <select name="ctpsUF" className={input} defaultValue="">
                  <option value="">UF</option>
                  {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>
              <div>
                <label className={label}>PIS/PASEP</label>
                <input type="text" name="pisPasep" className={input} placeholder="000.00000.00-0" maxLength={14} />
              </div>
            </div>
          </div>

          {/* Dados Bancários */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Dados Bancários</h2>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className={label}>Banco</label>
                <input type="text" name="banco" className={input} placeholder="Ex: 001" />
              </div>
              <div>
                <label className={label}>Agência</label>
                <input type="text" name="agencia" className={input} placeholder="0000" />
              </div>
              <div>
                <label className={label}>Conta</label>
                <input type="text" name="conta" className={input} placeholder="00000-0" />
              </div>
              <div>
                <label className={label}>Tipo de Conta</label>
                <select name="tipoConta" className={input} defaultValue="">
                  <option value="">Selecione</option>
                  <option value="CORRENTE">Corrente</option>
                  <option value="POUPANCA">Poupança</option>
                  <option value="SALARIO">Conta Salário</option>
                  <option value="PIX">PIX</option>
                </select>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-3 pb-6">
            <a
              href="/funcionarios"
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </a>
            <button
              type="submit"
              disabled={loading || !empresaId}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              {loading ? "Salvando..." : "Cadastrar Funcionário"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
