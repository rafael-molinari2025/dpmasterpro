import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { db } from "@/lib/db";

// Parseia CSV simples (suporta aspas e vírgulas internas)
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  for (const line of lines) {
    if (!line.trim()) continue;
    const cells: string[] = [];
    let cur = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuote = !inQuote;
      } else if (ch === ";" && !inQuote) {
        cells.push(cur.trim()); cur = "";
      } else if (ch === "," && !inQuote) {
        cells.push(cur.trim()); cur = "";
      } else {
        cur += ch;
      }
    }
    cells.push(cur.trim());
    rows.push(cells);
  }
  return rows;
}

const strip = (v: string) => v.replace(/\D/g, "");

export async function POST(req: NextRequest) {
  const guard = await requireAuth();
  if (!guard.ok) return guard.response;
  const { escritorioId } = guard.session;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const empresaId = formData.get("empresaId") as string | null;

    if (!file) return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
    if (!empresaId) return NextResponse.json({ error: "empresaId obrigatório" }, { status: 400 });

    const empresa = await db.empresa.findFirst({ where: { id: empresaId, escritorioId } });
    if (!empresa) return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });

    const text = await file.text();
    const rows = parseCSV(text);
    if (rows.length < 2) return NextResponse.json({ error: "Arquivo vazio ou sem dados" }, { status: 400 });

    // Normaliza cabeçalho
    const header = rows[0].map((h) => h.toLowerCase().trim()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/\s+/g, "_"));

    const idx = (name: string) => {
      const aliases: Record<string, string[]> = {
        nome: ["nome", "nome_completo", "funcionario"],
        cpf: ["cpf"],
        datanascimento: ["data_nascimento", "nascimento", "dt_nascimento"],
        sexo: ["sexo", "genero"],
        dataadmissao: ["data_admissao", "admissao", "dt_admissao"],
        salario: ["salario", "salario_base", "remuneracao"],
        matricula: ["matricula", "num_matricula"],
        email: ["email", "e-mail"],
        celular: ["celular", "telefone_celular"],
        cargo: ["cargo", "cargo_descricao"],
        setor: ["setor", "setor_descricao"],
        pisPasep: ["pis", "pasep", "pis_pasep", "nit"],
        estadoCivil: ["estado_civil", "estadocivil"],
        tipoContrato: ["tipo_contrato", "tipocontrato", "contrato"],
      };
      const alts = aliases[name] ?? [name];
      for (const alt of alts) {
        const i = header.indexOf(alt);
        if (i >= 0) return i;
      }
      return -1;
    };

    const get = (row: string[], name: string) => row[idx(name)]?.trim() ?? "";

    const resultados: { linha: number; status: "ok" | "erro" | "ignorado"; mensagem?: string; nome?: string }[] = [];
    let criados = 0;
    let erros = 0;
    let ignorados = 0;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.every((c) => !c)) continue;

      const nome = get(row, "nome");
      const cpfRaw = strip(get(row, "cpf"));
      const salarioRaw = get(row, "salario").replace(",", ".");
      const dataAdmissaoRaw = get(row, "dataadmissao");

      if (!nome || !cpfRaw || !salarioRaw || !dataAdmissaoRaw) {
        resultados.push({ linha: i + 1, status: "erro", mensagem: "Campos obrigatórios ausentes (nome, CPF, salário, data de admissão)" });
        erros++;
        continue;
      }

      // Verifica duplicata
      const existente = await db.funcionario.findFirst({ where: { cpf: cpfRaw, empresa: { escritorioId } } });
      if (existente) {
        resultados.push({ linha: i + 1, status: "ignorado", mensagem: `CPF já cadastrado (${existente.nome})`, nome });
        ignorados++;
        continue;
      }

      // Parse data (aceita dd/mm/aaaa ou aaaa-mm-dd)
      let dataAdmissao: Date;
      try {
        if (dataAdmissaoRaw.includes("/")) {
          const [d, m, y] = dataAdmissaoRaw.split("/");
          dataAdmissao = new Date(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
        } else {
          dataAdmissao = new Date(dataAdmissaoRaw);
        }
        if (isNaN(dataAdmissao.getTime())) throw new Error("Data inválida");
      } catch {
        resultados.push({ linha: i + 1, status: "erro", mensagem: "Data de admissão inválida", nome });
        erros++;
        continue;
      }

      let dataNascimento: Date | undefined;
      const dnRaw = get(row, "datanascimento");
      if (dnRaw) {
        try {
          if (dnRaw.includes("/")) {
            const [d, m, y] = dnRaw.split("/");
            dataNascimento = new Date(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
          } else {
            dataNascimento = new Date(dnRaw);
          }
          if (isNaN(dataNascimento.getTime())) dataNascimento = undefined;
        } catch { dataNascimento = undefined; }
      }

      const salario = parseFloat(salarioRaw);
      if (isNaN(salario) || salario <= 0) {
        resultados.push({ linha: i + 1, status: "erro", mensagem: "Salário inválido", nome });
        erros++;
        continue;
      }

      // Resolve cargo e setor por descrição
      const cargoDesc = get(row, "cargo");
      const setorDesc = get(row, "setor");
      let cargoId: string | undefined;
      let setorId: string | undefined;

      if (cargoDesc) {
        const cargo = await db.cargo.findFirst({ where: { empresaId, descricao: { contains: cargoDesc, mode: "insensitive" } } });
        if (cargo) cargoId = cargo.id;
      }
      if (setorDesc) {
        const setor = await db.setor.findFirst({ where: { empresaId, descricao: { contains: setorDesc, mode: "insensitive" } } });
        if (setor) setorId = setor.id;
      }

      // Próxima matrícula
      const ultima = await db.funcionario.findFirst({
        where: { empresaId },
        orderBy: { matricula: "desc" },
        select: { matricula: true },
      });
      const matricula = get(row, "matricula") || String(parseInt(ultima?.matricula ?? "0") + 1).padStart(5, "0");

      const sexoRaw = get(row, "sexo").toUpperCase();
      const sexo = sexoRaw === "F" || sexoRaw === "FEMININO" ? "F" : "M";

      const estadoCivilRaw = get(row, "estadoCivil").toUpperCase();
      const estadoCivilMap: Record<string, string> = { CASADO: "CASADO", CASADA: "CASADO", DIVORCIADO: "DIVORCIADO", DIVORCIADA: "DIVORCIADO", VIUVO: "VIUVO", VIUVA: "VIUVO" };
      const estadoCivil = (estadoCivilMap[estadoCivilRaw] ?? "SOLTEIRO") as any;

      const tipoContratoRaw = get(row, "tipoContrato").toUpperCase();
      const tipoContratoMap: Record<string, string> = { EXPERIENCIA: "EXPERIENCIA", EXPERIÊNCIA: "EXPERIENCIA", TEMPORARIO: "TEMPORARIO", TEMPORÁRIO: "TEMPORARIO", ESTAGIO: "ESTAGIO", ESTÁGIO: "ESTAGIO" };
      const tipoContrato = (tipoContratoMap[tipoContratoRaw] ?? "CLT") as any;

      try {
        await db.funcionario.create({
          data: {
            empresaId,
            matricula,
            nome,
            cpf: cpfRaw,
            dataNascimento: dataNascimento ?? new Date("1990-01-01"),
            sexo: sexo as any,
            estadoCivil,
            tipoContrato,
            dataAdmissao,
            salario,
            jornadaHoras: 220,
            tipoJornada: "MENSAL",
            categoriaESocial: "101",
            situacao: "ATIVO",
            ...(cargoId && { cargoId }),
            ...(setorId && { setorId }),
            ...(get(row, "email") && { email: get(row, "email") }),
            ...(strip(get(row, "celular")) && { celular: strip(get(row, "celular")) }),
            ...(strip(get(row, "pisPasep")) && { pisPasep: strip(get(row, "pisPasep")) }),
          },
        });
        resultados.push({ linha: i + 1, status: "ok", nome });
        criados++;
      } catch (err: any) {
        resultados.push({ linha: i + 1, status: "erro", mensagem: err.message ?? "Erro ao criar", nome });
        erros++;
      }
    }

    return NextResponse.json({ criados, erros, ignorados, resultados });
  } catch (error) {
    console.error("Erro na importação:", error);
    return NextResponse.json({ error: "Erro ao processar arquivo" }, { status: 500 });
  }
}
