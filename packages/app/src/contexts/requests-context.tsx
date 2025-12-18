import { createContext, useCallback, useContext, useMemo, useState } from "react";

// Types for request system
export type RequestType =
  | "pre_proforma"
  | "dados_importador"
  | "schedule_proforma"
  | "fichas_tecnicas"
  | "drafts"
  | "alteracao_documento"
  | "alteracao_bl"
  | "schedule_booking"
  | "telex_release"
  | "documento"
  | "embarque"
  | "financeiro";

export type RequestStatus = "em_andamento" | "aguardando_cliente" | "concluido" | "cancelado";

export interface PreProformaData {
  paletizacao: boolean | null;
  restricaoArmador: { has: boolean; value: string } | null;
  limitePeso: { has: boolean; value: string } | null;
}

export interface PartyData {
  companyName: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
}

export interface DadosImportadorData {
  importer: PartyData | null;
  consigneeBL: PartyData | null;
  consigneeHC: PartyData | null;
  notifyParty: PartyData | null;
}

export interface ScheduleProformaData {
  navio: string;
  portoEmbarque: string;
  portoDestino: string;
  eta: string;
  pesoContainer: string;
  paletizado: boolean | null;
  aprovado: boolean | null;
  observacoes: string;
}

export interface ProdutoFicha {
  codigo: string;
  nome: string;
  fichaTecnica: boolean;
  etiquetaInterna: boolean;
  etiquetaExterna: boolean;
}

export interface FichasTecnicasData {
  proformaRef: string;
  produtos: ProdutoFicha[];
  solicitarEtiquetas: boolean | null;
}

export interface DraftsData {
  contratoRef: string;
  metodoEnvio: "download" | "email" | null;
  emailDestino: string;
}

export interface AlteracaoDocumentoData {
  contratoRef: string;
  tipoDocumento: string;
  descricaoAlteracao: string;
  campoCorrigir: string;
}

export interface AlteracaoBLData {
  contratoRef: string;
  descricaoAlteracao: string;
  aceitaCusto: boolean | null;
  custoEstimado: string;
}

export interface ScheduleBookingData {
  contratoRef: string;
  navio: string;
  cutOff: string;
  estufagem: string;
  eta: string;
  portoDestino: string;
  enviarPorEmail: boolean | null;
  emailDestino: string;
}

export interface TelexReleaseData {
  contratoRef: string;
  metodoRecebimento: "email" | "chat" | null;
  emailDestino: string;
  statusPagamento: "pendente" | "confirmado";
  statusLiberacao: "pendente" | "aprovado";
}

export type RequestData =
  | PreProformaData
  | DadosImportadorData
  | ScheduleProformaData
  | FichasTecnicasData
  | DraftsData
  | AlteracaoDocumentoData
  | AlteracaoBLData
  | ScheduleBookingData
  | TelexReleaseData
  | Record<string, unknown>;

export interface Request {
  id: string;
  companyId: string;
  type: RequestType;
  title: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  data: RequestData;
}

interface RequestsContextType {
  requests: Request[];
  getCompanyRequests: (companyId: string) => Request[];
  createRequest: (companyId: string, type: RequestType) => Request;
  updateRequestData: (requestId: string, data: Partial<RequestData>) => void;
  updateRequestStatus: (requestId: string, status: RequestStatus) => void;
  getRequestById: (id: string) => Request | undefined;
}

const RequestsContext = createContext<RequestsContextType | null>(null);

// Empty party data template
const EMPTY_PARTY: PartyData = {
  companyName: "",
  address: "",
  contactPerson: "",
  phone: "",
  email: "",
};

// Mock initial requests
const INITIAL_REQUESTS: Request[] = [
  {
    id: "req-1",
    companyId: "company-1",
    type: "pre_proforma",
    title: "Pre-Proforma - Embarque #2024-001",
    status: "concluido",
    createdAt: "2024-12-10T10:30:00",
    updatedAt: "2024-12-10T11:15:00",
    data: {
      paletizacao: true,
      restricaoArmador: { has: false, value: "" },
      limitePeso: { has: true, value: "25000" },
    },
  },
  {
    id: "req-2",
    companyId: "company-1",
    type: "pre_proforma",
    title: "Pre-Proforma - Embarque #2024-002",
    status: "em_andamento",
    createdAt: "2024-12-15T14:00:00",
    updatedAt: "2024-12-15T14:05:00",
    data: {
      paletizacao: false,
      restricaoArmador: null,
      limitePeso: null,
    },
  },
  {
    id: "req-3",
    companyId: "company-2",
    type: "pre_proforma",
    title: "Pre-Proforma - Embarque #2024-003",
    status: "concluido",
    createdAt: "2024-12-12T09:00:00",
    updatedAt: "2024-12-12T09:30:00",
    data: {
      paletizacao: false,
      restricaoArmador: { has: true, value: "Maersk" },
      limitePeso: { has: false, value: "" },
    },
  },
  {
    id: "req-4",
    companyId: "company-1",
    type: "dados_importador",
    title: "Dados Importador - Embarque #2024-004",
    status: "concluido",
    createdAt: "2024-12-11T08:00:00",
    updatedAt: "2024-12-11T09:00:00",
    data: {
      importer: {
        companyName: "Brasil Sul Importadora",
        address: "Rua das Palmeiras, 500 - Itajai, SC",
        contactPerson: "Joao Silva",
        phone: "(47) 3333-4444",
        email: "joao@brasilsul.com.br",
      },
      consigneeBL: {
        companyName: "Brasil Sul Importadora",
        address: "Rua das Palmeiras, 500 - Itajai, SC",
        contactPerson: "Joao Silva",
        phone: "(47) 3333-4444",
        email: "joao@brasilsul.com.br",
      },
      consigneeHC: {
        companyName: "Brasil Sul Importadora",
        address: "Rua das Palmeiras, 500 - Itajai, SC",
        contactPerson: "Maria Costa",
        phone: "(47) 3333-5555",
        email: "maria@brasilsul.com.br",
      },
      notifyParty: {
        companyName: "Despachante Express",
        address: "Av. Portuaria, 100 - Santos, SP",
        contactPerson: "Carlos Mendes",
        phone: "(13) 9999-8888",
        email: "carlos@despachante.com.br",
      },
    },
  },
];

const REQUEST_TYPE_TITLES: Record<RequestType, string> = {
  pre_proforma: "Pre-Proforma",
  dados_importador: "Dados Importador",
  schedule_proforma: "Schedule e Proforma",
  fichas_tecnicas: "Fichas Tecnicas",
  drafts: "Drafts",
  alteracao_documento: "Alteracao de Documento",
  alteracao_bl: "Alteracao de BL",
  schedule_booking: "Schedule do Booking",
  telex_release: "Telex Release",
  documento: "Solicitacao de Documento",
  embarque: "Acompanhamento de Embarque",
  financeiro: "Solicitacao Financeira",
};

// Initial data for each request type
const getInitialData = (type: RequestType): RequestData => {
  switch (type) {
    case "pre_proforma":
      return {
        paletizacao: null,
        restricaoArmador: null,
        limitePeso: null,
      };
    case "dados_importador":
      return {
        importer: null,
        consigneeBL: null,
        consigneeHC: null,
        notifyParty: null,
      };
    case "schedule_proforma":
      return {
        navio: "",
        portoEmbarque: "",
        portoDestino: "",
        eta: "",
        pesoContainer: "",
        paletizado: null,
        aprovado: null,
        observacoes: "",
      };
    case "fichas_tecnicas":
      return {
        proformaRef: "",
        produtos: [],
        solicitarEtiquetas: null,
      };
    case "drafts":
      return {
        contratoRef: "",
        metodoEnvio: null,
        emailDestino: "",
      };
    case "alteracao_documento":
      return {
        contratoRef: "",
        tipoDocumento: "",
        descricaoAlteracao: "",
        campoCorrigir: "",
      };
    case "alteracao_bl":
      return {
        contratoRef: "",
        descricaoAlteracao: "",
        aceitaCusto: null,
        custoEstimado: "",
      };
    case "schedule_booking":
      return {
        contratoRef: "",
        navio: "",
        cutOff: "",
        estufagem: "",
        eta: "",
        portoDestino: "",
        enviarPorEmail: null,
        emailDestino: "",
      };
    case "telex_release":
      return {
        contratoRef: "",
        metodoRecebimento: null,
        emailDestino: "",
        statusPagamento: "pendente",
        statusLiberacao: "pendente",
      };
    default:
      return {};
  }
};

interface RequestsProviderProps {
  children: React.ReactNode;
}

export function RequestsProvider({ children }: RequestsProviderProps) {
  const [requests, setRequests] = useState<Request[]>(INITIAL_REQUESTS);

  const getCompanyRequests = useCallback(
    (companyId: string) => {
      return requests
        .filter((r) => r.companyId === companyId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    [requests]
  );

  const getRequestById = useCallback(
    (id: string) => {
      return requests.find((r) => r.id === id);
    },
    [requests]
  );

  const createRequest = useCallback((companyId: string, type: RequestType): Request => {
    const now = new Date().toISOString();
    const requestNumber = `${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`;

    const newRequest: Request = {
      id: `req-${Date.now()}`,
      companyId,
      type,
      title: `${REQUEST_TYPE_TITLES[type]} - Embarque #${requestNumber}`,
      status: "em_andamento",
      createdAt: now,
      updatedAt: now,
      data: getInitialData(type),
    };

    setRequests((prev) => [newRequest, ...prev]);
    return newRequest;
  }, []);

  const updateRequestData = useCallback((requestId: string, data: Partial<RequestData>) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? { ...r, data: { ...r.data, ...data }, updatedAt: new Date().toISOString() }
          : r
      )
    );
  }, []);

  const updateRequestStatus = useCallback((requestId: string, status: RequestStatus) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId ? { ...r, status, updatedAt: new Date().toISOString() } : r
      )
    );
  }, []);

  const value = useMemo(
    () => ({
      requests,
      getCompanyRequests,
      createRequest,
      updateRequestData,
      updateRequestStatus,
      getRequestById,
    }),
    [
      requests,
      getCompanyRequests,
      createRequest,
      updateRequestData,
      updateRequestStatus,
      getRequestById,
    ]
  );

  return <RequestsContext.Provider value={value}>{children}</RequestsContext.Provider>;
}

export function useRequests() {
  const context = useContext(RequestsContext);
  if (!context) {
    throw new Error("useRequests must be used within a RequestsProvider");
  }
  return context;
}

export { EMPTY_PARTY };
