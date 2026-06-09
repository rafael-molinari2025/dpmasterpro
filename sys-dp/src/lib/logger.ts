import { db } from "./db";

export type NivelLog = "INFO" | "AVISO" | "ERRO" | "CRITICO";
export type TipoLog =
  | "AUTENTICACAO"
  | "EMPRESA"
  | "FUNCIONARIO"
  | "FOLHA"
  | "FERIAS"
  | "RESCISAO"
  | "ESOCIAL"
  | "BACKUP"
  | "USUARIO"
  | "CONFIGURACAO"
  | "SISTEMA";

export interface RegistrarLogParams {
  escritorioId: string;
  usuarioId?: string;
  nomeUsuario?: string;
  nivel?: NivelLog;
  tipo: TipoLog;
  modulo: string;
  acao: string;
  descricao: string;
  detalhes?: Record<string, unknown>;
  ip?: string;
}

export async function registrarLog(params: RegistrarLogParams): Promise<void> {
  try {
    await db.logSistema.create({
      data: {
        escritorioId: params.escritorioId,
        usuarioId: params.usuarioId ?? null,
        nomeUsuario: params.nomeUsuario ?? null,
        nivel: params.nivel ?? "INFO",
        tipo: params.tipo,
        modulo: params.modulo,
        acao: params.acao,
        descricao: params.descricao,
        detalhes: params.detalhes ?? null,
        ip: params.ip ?? null,
      },
    });
  } catch {
    // Logging never throws — falha silenciosa para não afetar a operação principal
  }
}
