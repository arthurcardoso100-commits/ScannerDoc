export const AppState = {
  IDLE: "IDLE",
  PROCESSING: "PROCESSING",
  SUCCESS: "SUCCESS",
  ERROR: "ERROR",
} as const;

export type AppState = typeof AppState[keyof typeof AppState];

export interface ASOData {
  nome: string;
  cpf: string;
  cargo: string;
  aptidoes: {
    funcao: boolean;
    altura: boolean;
    espacoConfinado: boolean;
    eletricidade: boolean;
  };
  assinaturas: {
    medico: boolean;
    tecnico: boolean;
    data: string;
  };
  riscos: string[];
}

export interface ExcelData {
  nome: string;
  cpf: string;
  cargo: string;
}

export interface ValidationResult {
  nome: {
    ok: boolean;
    msg: string;
    pdfVal: string;
    baseVal: string;
  };
  cpf: {
    ok: boolean;
    msg: string;
    pdfVal: string;
    baseVal: string;
  };
  cargo: {
    ok: boolean;
    msg: string;
    pdfVal: string;
    baseVal: string;
  };
  aptidao: {
    ok: boolean;
    msg: string;
    failedFields: string[];
  };
  assinaturas: {
    medico: boolean;
    tecnico: boolean;
    data: {
      valid: boolean;
      value: string;
      msg: string;
    };
  };
  riscos: {
    ok: boolean;
    msg: string;
    missingRisks: string[];
  };
}
