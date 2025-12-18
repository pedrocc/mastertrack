import type { Request, RequestStatus, RequestType } from "@mastertrack/api";
import type { JsonSerialized } from "@mastertrack/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useMemo } from "react";
import { api, handleResponse } from "../lib/api";

type RequestJson = JsonSerialized<Request>;

// Re-export types for convenience
export type { RequestStatus, RequestType };

// Data types for each request type
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

// Empty party data template
export const EMPTY_PARTY: PartyData = {
  companyName: "",
  address: "",
  contactPerson: "",
  phone: "",
  email: "",
};

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

// Extended request type with parsed data and proper types
export interface RequestWithData extends Omit<RequestJson, "data" | "status" | "type"> {
  data: RequestData;
  status: RequestStatus;
  type: RequestType;
}

interface RequestsContextType {
  requests: RequestWithData[];
  isLoading: boolean;
  getCompanyRequests: (companyId: string) => RequestWithData[];
  createRequest: (companyId: string, type: RequestType) => Promise<RequestWithData>;
  updateRequestData: (requestId: string, data: Partial<RequestData>) => Promise<void>;
  updateRequestStatus: (
    requestId: string,
    status: RequestStatus,
    seenByClient?: boolean
  ) => Promise<void>;
  getRequestById: (id: string) => RequestWithData | undefined;
  // Cliente
  markStatusAsSeen: (requestId: string) => Promise<void>;
  getUnseenStatusCount: (companyId: string) => number;
  // Admin
  markAsSeenByAdmin: (requestId: string) => Promise<void>;
  getUnseenByAdminCount: () => number;
}

const RequestsContext = createContext<RequestsContextType | null>(null);

interface RequestsProviderProps {
  children: React.ReactNode;
}

// Helper to parse request data
const parseRequestData = (request: RequestJson): RequestWithData => {
  let parsedData: RequestData;
  try {
    parsedData = JSON.parse(request.data) as RequestData;
  } catch {
    parsedData = {};
  }
  return {
    ...request,
    data: parsedData,
    status: request.status as RequestStatus,
    type: request.type as RequestType,
  };
};

export function RequestsProvider({ children }: RequestsProviderProps) {
  const queryClient = useQueryClient();

  // Fetch all requests
  const { data: rawRequests = [], isLoading } = useQuery({
    queryKey: ["requests"],
    queryFn: async () => {
      const response = await api.api.requests.$get();
      const result = await handleResponse<{ data: RequestJson[] }>(response);
      return result.data;
    },
    staleTime: 0,
    refetchInterval: 10000, // Poll every 10 seconds
  });

  // Parse requests data
  const requests = useMemo(() => rawRequests.map(parseRequestData), [rawRequests]);

  // Create request mutation
  const createRequestMutation = useMutation({
    mutationFn: async ({ companyId, type }: { companyId: string; type: RequestType }) => {
      const requestNumber = `${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`;
      const title = `${REQUEST_TYPE_TITLES[type]} - Embarque #${requestNumber}`;
      const data = JSON.stringify(getInitialData(type));

      const response = await api.api.requests.$post({
        json: { companyId, type, title, data },
      });
      const result = await handleResponse<{ data: RequestJson }>(response);
      return parseRequestData(result.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });

  // Update request data mutation
  const updateDataMutation = useMutation({
    mutationFn: async ({ requestId, data }: { requestId: string; data: Partial<RequestData> }) => {
      // Get current request data
      const current = requests.find((r) => r.id === requestId);
      const mergedData = { ...(current?.data || {}), ...data };

      const response = await api.api.requests[":id"].data.$put({
        param: { id: requestId },
        json: { data: JSON.stringify(mergedData) },
      });
      return handleResponse<{ data: RequestJson }>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });

  // Update request status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      requestId,
      status,
      seenByClient,
    }: {
      requestId: string;
      status: RequestStatus;
      seenByClient: boolean;
    }) => {
      const response = await api.api.requests[":id"].status.$put({
        param: { id: requestId },
        json: { status, seenByClient },
      });
      return handleResponse<{ data: RequestJson }>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });

  // Mark as seen mutation
  const markSeenMutation = useMutation({
    mutationFn: async ({
      requestId,
      seenByAdmin,
      statusSeenByClient,
    }: {
      requestId: string;
      seenByAdmin?: boolean;
      statusSeenByClient?: boolean;
    }) => {
      const response = await api.api.requests[":id"].seen.$put({
        param: { id: requestId },
        json: { seenByAdmin, statusSeenByClient },
      });
      return handleResponse<{ data: RequestJson }>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });

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

  // biome-ignore lint/correctness/useExhaustiveDependencies: mutateAsync is stable
  const createRequest = useCallback(
    async (companyId: string, type: RequestType): Promise<RequestWithData> => {
      return createRequestMutation.mutateAsync({ companyId, type });
    },
    []
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: mutateAsync is stable
  const updateRequestData = useCallback(async (requestId: string, data: Partial<RequestData>) => {
    await updateDataMutation.mutateAsync({ requestId, data });
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: mutateAsync is stable
  const updateRequestStatus = useCallback(
    async (requestId: string, status: RequestStatus, seenByClient = false) => {
      await updateStatusMutation.mutateAsync({ requestId, status, seenByClient });
    },
    []
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: mutateAsync is stable
  const markStatusAsSeen = useCallback(async (requestId: string) => {
    await markSeenMutation.mutateAsync({ requestId, statusSeenByClient: true });
  }, []);

  const getUnseenStatusCount = useCallback(
    (companyId: string) => {
      return requests.filter((r) => r.companyId === companyId && !r.statusSeenByClient).length;
    },
    [requests]
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: mutateAsync is stable
  const markAsSeenByAdmin = useCallback(async (requestId: string) => {
    await markSeenMutation.mutateAsync({ requestId, seenByAdmin: true });
  }, []);

  const getUnseenByAdminCount = useCallback(() => {
    return requests.filter((r) => !r.seenByAdmin).length;
  }, [requests]);

  const value = useMemo(
    () => ({
      requests,
      isLoading,
      getCompanyRequests,
      createRequest,
      updateRequestData,
      updateRequestStatus,
      getRequestById,
      markStatusAsSeen,
      getUnseenStatusCount,
      markAsSeenByAdmin,
      getUnseenByAdminCount,
    }),
    [
      requests,
      isLoading,
      getCompanyRequests,
      createRequest,
      updateRequestData,
      updateRequestStatus,
      getRequestById,
      markStatusAsSeen,
      getUnseenStatusCount,
      markAsSeenByAdmin,
      getUnseenByAdminCount,
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

// Re-export type for components that need the full request type
export type { RequestWithData as Request };
