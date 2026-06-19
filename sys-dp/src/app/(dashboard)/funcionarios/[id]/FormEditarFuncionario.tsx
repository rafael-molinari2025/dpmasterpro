"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, AlertCircle, CheckCircle } from "lucide-react";

interface Cargo { id: string; descricao: string; codigo: string; empresaId: string; }
interface Setor { id: string; descricao: string; codigo: string; empresaId: string; }

interface Funcionario {
  id: string;
  empresaId: string;
  matricula: string;
  nome: string;
  cpf: string;
  rg: string | null;
  rgOrgao: string | null;
  rgUF: string | null;
  dataNascimento: string;
  sexo: string;
  estadoCivil: string;
  escolaridade: string | null;
  naturalidade: string | null;
  nacionalidade: string;
  email: string | null;
  telefone: string | null;
  celular: string | null;
  endereco: Record<string, string> | null;
  tipoContrato: string;
  salario: number;
  jornadaHoras: number;
  tipoJornada: string;
  ctps: string | null;
  ctpsSerie: string | null;
  ctpsUF: string | null;
  pisPasep: string | null;
  categoriaESocial: string;
  banco: string | null;
  agencia: string | null;
  conta: string | null;
  tipoConta: string | null;
  situacao: string;
  cargoId: string | null;
  setorId: string | null;
}

interface Props {
  funcionario: Funcionario;
  cargos: Cargo[];
  setores: Setor[];
}

const UFS = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];
const lb = "block text-xs font-medium text-gray-600 mb-1";
const inp = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

export default function FormEditarFuncionario({ funcionario, cargos, setores }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [resultado, setResultado] = useState<{ tipo: "sucesso" | "erro"; msg: string } | null>(null);

  const cargosFiltrados = cargos.filter((c) => c.empresaId === funcionario.empresaId);
  const setoresFiltrados = setores.filter((s) => s.empresaId === funcionario.empresaId);

  const [form, setForm] = useState({
    nome: funcionario.nome,
    email: funcionario.email ?? "",
    telefone: funcionario.telefone ?? "",
    celular: funcionario.celular ?? "",
    cargoId: funcionario.cargoId ?? "",
    setorId: funcionario.setorId ?? "",
    salario: String(funcionario.salario),
    jornadaHoras: String(funcionario.jornadaHoras),
    tipoJornada: funcionario.tipoJornada,
    tipoContrato: funcionario.tipoContrato,
    estadoCivil: funcionario.estadoCivil,
    escolaridade: funcionario.escolaridade ?? "",
    naturalidade: funcionario.naturalidade ?? "",
    nacionalidade: funcionario.nacionalidade,
    rg: funcionario.rg ?? "",
    rgOrgao: funcionario.rgOrgao ?? "",
    rgUF: funcionario.rgUF ?? "",
    ctps: funcionario.ctps ?? "",
    ctpsSerie: funcionario.ctpsSerie ?? "",
    ctpsUF: funcionario.ctpsUF ?? "",
    pisPasep: funcionario.pisPasep ?? "",
    banco: funcionario.banco ?? "",
    agencia: funcionario.agencia ?? "",
    conta: funcionario.conta ?? "",
    tipoConta: funcionario.tipoConta ?? "",
    categoriaESocial: funcionario.categoriaESocial,
    situacao: funcionario.situacao,
    // endereço
    endCEP: funcionario.endereco?.cep ?? "",
    endLogradouro: funcionario.endereco?.logradouro ?? "",
    endNumero: funcionario.endereco?.numero ?? "",
    endComplemento: funcionario.endereco?.complemento ?? "",
    endBairro: funcionario.endereco?.bairro ?? "",
    endCidade: funcionario.endereco?.cidade ?? "",
    endUF: funcionario.endereco?.uf ?? "",
  });

  function f(key: keyof typeof form) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm((v) => ({ ...v, [key]: e.target.value })),
    };
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setResultado(null);
    try {
      const payload: Record<string, unknown> = {
        nome: form.nome,
        email: form.email || null,
        telefone: form.telefone || null,
        celular: form.celular || null,
        cargoId: form.cargoId || null,
        setorId: form.setorId || null,
        salario: parseFloat(form.salario),
        jornadaHoras: parseInt(form.jornadaHoras),
        tipoJornada: form.tipoJornada,
        tipoContrato: form.tipoContrato,
        estadoCivil: form.estadoCivil,
        escolaridade: form.escolaridade || null,
        naturalidade: form.naturalidade || null,
        nacionalidade: form.nacionalidade,
        rg: form.rg || null,
        rgOrgao: form.rgOrgao || null,
        rgUF: form.rgUF || null,
        ctps: form.ctps || null,
        ctpsSerie: form.ctpsSerie || null,
        ctpsUF: form.ctpsUF || null,
        pisPasep: form.pisPasep || null,
        banco: form.banco || null,
        agencia: form.agencia || null,
        conta: form.conta || null,
        tipoConta: form.tipoConta || null,
        categoriaESocial: form.categoriaESocial,
        situacao: form.situacao,
        endereco: form.endLogradouro || form.endCidade
          ? {
              cep: form.endCEP.replace(/\D/g, ""),
              logradouro: form.endLogradouro,
              numero: form.endNumero,
              complemento: form.endComplemento,
              bairro: form.endBairro,
              cidade: form.endCidade,
              uf: form.endUF,
            }
          : null,
      };

      const res = await fetch(`/api/funcionarios/${funcionario.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setResultado({ tipo: "erro", msg: data.error ?? "Erro ao salvar." });
      } else {
        setResultado({ tipo: "sucesso", msg: "Dados salvos com sucesso!" });
        router.refresh();
      }
    } catch {
      setResultado({ tipo: "erro", msg: "Erro de conexão." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={salvar} className="space-y-6">

      {/* Identificação — readonly */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <p className="text-slate-500">Matrícula</p>
          <p className="font-semibold text-slate-800 font-mono mt-0.5">{funcionario.matricula}</p>
        </div>
        <div>
          <p className="text-slate-500">CPF</p>
          <p className="font-semibold text-slate-800 font-mono mt-0.5">
            {funcionario.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}
          </p>
        </div>
        <div>
          <p className="text-slate-500">Nascimento</p>
          <p className="font-medium text-slate-700 mt-0.5">
            {new Date(funcionario.dataNascimento).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
          </p>
        </div>
        <div>
          <p className="text-slate-500">Admissão</p>
          <p className="font-medium text-slate-700 mt-0.5">
            {new Date((funcionario as any).dataAdmissao).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
          </p>
        </div>
      </div>

      {/* Dados Pessoais */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-800">Dados Pessoais</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={lb}>Nome Completo *</label>
            <input type="text" required className={inp} {...f("nome")} />
          </div>
          <div>
            <label className={lb}>Estado Civil</label>
            <select className={inp} {...f("estadoCivil")}>
              <option value="SOLTEIRO">Solteiro(a)</option>
              <option value="CASADO">Casado(a)</option>
              <option value="DIVORCIADO">Divorciado(a)</option>
              <option value="VIUVO">Viúvo(a)</option>
              <option value="UNIAO_ESTAVEL">União Estável</option>
            </select>
          </div>
          <div>
            <label className={lb}>Escolaridade</label>
            <select className={inp} {...f("escolaridade")}>
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
            <label className={lb}>Naturalidade</label>
            <input type="text" className={inp} placeholder="Cidade natal" {...f("naturalidade")} />
          </div>
          <div>
            <label className={lb}>Nacionalidade</label>
            <input type="text" className={inp} {...f("nacionalidade")} />
          </div>
          <div>
            <label className={lb}>RG</label>
            <input type="text" className={inp} {...f("rg")} />
          </div>
          <div>
            <label className={lb}>Órgão Emissor</label>
            <input type="text" className={inp} placeholder="Ex: SSP" {...f("rgOrgao")} />
          </div>
          <div>
            <label className={lb}>UF do RG</label>
            <select className={inp} {...f("rgUF")}>
              <option value="">UF</option>
              {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Contato */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-800">Contato</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className={lb}>E-mail</label>
            <input type="email" className={inp} placeholder="email@exemplo.com" {...f("email")} />
          </div>
          <div>
            <label className={lb}>Celular</label>
            <input type="text" className={inp} placeholder="(00) 9 0000-0000" {...f("celular")} />
          </div>
          <div>
            <label className={lb}>Telefone</label>
            <input type="text" className={inp} placeholder="(00) 0000-0000" {...f("telefone")} />
          </div>
        </div>
      </div>

      {/* Endereço */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-800">Endereço</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className={lb}>CEP</label>
            <input type="text" className={inp} placeholder="00000-000" {...f("endCEP")} />
          </div>
          <div className="col-span-2 sm:col-span-2">
            <label className={lb}>Logradouro</label>
            <input type="text" className={inp} {...f("endLogradouro")} />
          </div>
          <div>
            <label className={lb}>Número</label>
            <input type="text" className={inp} {...f("endNumero")} />
          </div>
          <div className="col-span-2 sm:col-span-2">
            <label className={lb}>Complemento</label>
            <input type="text" className={inp} {...f("endComplemento")} />
          </div>
          <div>
            <label className={lb}>Bairro</label>
            <input type="text" className={inp} {...f("endBairro")} />
          </div>
          <div>
            <label className={lb}>Cidade</label>
            <input type="text" className={inp} {...f("endCidade")} />
          </div>
          <div>
            <label className={lb}>UF</label>
            <select className={inp} {...f("endUF")}>
              <option value="">UF</option>
              {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Cargo, Setor e Jornada */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-800">Cargo, Setor e Jornada</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={lb}>Cargo</label>
            <select className={inp} {...f("cargoId")}>
              <option value="">Sem cargo</option>
              {cargosFiltrados.map((c) => (
                <option key={c.id} value={c.id}>{c.descricao} ({c.codigo})</option>
              ))}
            </select>
          </div>
          <div>
            <label className={lb}>Setor</label>
            <select className={inp} {...f("setorId")}>
              <option value="">Sem setor</option>
              {setoresFiltrados.map((s) => (
                <option key={s.id} value={s.id}>{s.descricao} ({s.codigo})</option>
              ))}
            </select>
          </div>
          <div>
            <label className={lb}>Salário (R$) *</label>
            <input type="number" step="0.01" min="0.01" required className={inp} {...f("salario")} />
          </div>
          <div>
            <label className={lb}>Jornada (horas/mês)</label>
            <input type="number" min="1" max="240" className={inp} {...f("jornadaHoras")} />
          </div>
          <div>
            <label className={lb}>Tipo de Jornada</label>
            <select className={inp} {...f("tipoJornada")}>
              <option value="MENSAL">Mensal</option>
              <option value="SEMANAL">Semanal</option>
              <option value="HORISTA">Horista</option>
            </select>
          </div>
          <div>
            <label className={lb}>Tipo de Contrato</label>
            <select className={inp} {...f("tipoContrato")}>
              <option value="CLT">CLT</option>
              <option value="EXPERIENCIA">Experiência</option>
              <option value="TEMPORARIO">Temporário</option>
              <option value="ESTAGIO">Estágio</option>
              <option value="JOVEM_APRENDIZ">Jovem Aprendiz</option>
              <option value="PJ">PJ</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={lb}>Categoria eSocial</label>
            <select className={inp} {...f("categoriaESocial")}>
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
          <div>
            <label className={lb}>Situação</label>
            <select className={inp} {...f("situacao")}>
              <option value="ATIVO">Ativo</option>
              <option value="FERIAS">Férias</option>
              <option value="AFASTADO">Afastado</option>
              <option value="DEMITIDO">Demitido</option>
            </select>
          </div>
        </div>
      </div>

      {/* Documentos */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-800">Documentos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className={lb}>CTPS</label>
            <input type="text" className={inp} placeholder="Número" {...f("ctps")} />
          </div>
          <div>
            <label className={lb}>Série CTPS</label>
            <input type="text" className={inp} {...f("ctpsSerie")} />
          </div>
          <div>
            <label className={lb}>UF CTPS</label>
            <select className={inp} {...f("ctpsUF")}>
              <option value="">UF</option>
              {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
            </select>
          </div>
          <div>
            <label className={lb}>PIS/PASEP</label>
            <input type="text" className={inp} placeholder="000.00000.00-0" {...f("pisPasep")} />
          </div>
        </div>
      </div>

      {/* Dados Bancários */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-800">Dados Bancários</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className={lb}>Banco</label>
            <input type="text" className={inp} placeholder="Ex: 001" {...f("banco")} />
          </div>
          <div>
            <label className={lb}>Agência</label>
            <input type="text" className={inp} {...f("agencia")} />
          </div>
          <div>
            <label className={lb}>Conta</label>
            <input type="text" className={inp} {...f("conta")} />
          </div>
          <div>
            <label className={lb}>Tipo de Conta</label>
            <select className={inp} {...f("tipoConta")}>
              <option value="">Selecione</option>
              <option value="CORRENTE">Corrente</option>
              <option value="POUPANCA">Poupança</option>
              <option value="SALARIO">Conta Salário</option>
              <option value="PIX">PIX</option>
            </select>
          </div>
        </div>
      </div>

      {/* Botão Salvar */}
      <div className="flex flex-wrap items-center gap-4 pb-6">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Save className={`w-4 h-4 ${saving ? "animate-pulse" : ""}`} />
          {saving ? "Salvando…" : "Salvar Alterações"}
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

    </form>
  );
}
