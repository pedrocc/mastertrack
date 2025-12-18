import type { RequestComment } from "@mastertrack/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Input } from "../../components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../../components/ui/sheet";
import { Textarea } from "../../components/ui/textarea";
import { useCompanies } from "../../contexts/companies-context";
import {
  useRequests,
  type Request,
  type RequestStatus,
  type RequestType,
} from "../../contexts/requests-context";
import { useSLASettings, type SLAStatus } from "../../contexts/sla-settings-context";
import { api, handleResponse } from "../../lib/api";
import type { JsonSerialized } from "@mastertrack/shared";

export const Route = createFileRoute("/admin/requests")({
  component: AdminRequestsPage,
});

const STATUS_CONFIG: Record<RequestStatus, { label: string; color: string; bgColor: string }> = {
  aberta: {
    label: "Aberta",
    color: "text-purple-700",
    bgColor: "bg-purple-50 border-purple-200",
  },
  em_andamento: {
    label: "Em Andamento",
    color: "text-blue-700",
    bgColor: "bg-blue-50 border-blue-200",
  },
  concluido: {
    label: "Concluída",
    color: "text-green-700",
    bgColor: "bg-green-50 border-green-200",
  },
  cancelado: {
    label: "Cancelada",
    color: "text-red-700",
    bgColor: "bg-red-50 border-red-200",
  },
};

const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
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

const KANBAN_COLUMNS: RequestStatus[] = ["aberta", "em_andamento", "concluido", "cancelado"];

function AdminRequestsPage() {
  const { requests, updateRequestStatus, getRequestById, markAsSeenByAdmin } = useRequests();
  const { getCompanyById } = useCompanies();
  const { calculateSLAStatus } = useSLASettings();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [filterType, setFilterType] = useState<RequestType | "all">("all");
  const [commentText, setCommentText] = useState("");

  // Query for comments of selected request
  const { data: commentsData, isLoading: isLoadingComments } = useQuery({
    queryKey: ["request-comments", selectedRequest?.id],
    queryFn: async () => {
      if (!selectedRequest?.id) return { data: [] };
      const res = await api.api.requests[":requestId"].comments.$get({
        param: { requestId: selectedRequest.id },
      });
      return handleResponse<{ data: JsonSerialized<RequestComment>[] }>(res);
    },
    enabled: !!selectedRequest?.id,
  });

  const comments = commentsData?.data || [];

  // Mutation to add a comment
  const addCommentMutation = useMutation({
    mutationFn: async (data: { requestId: string; content: string }) => {
      const res = await api.api.requests[":requestId"].comments.$post({
        param: { requestId: data.requestId },
        json: {
          authorId: "admin-1", // TODO: Get from auth context
          authorName: "Administrador",
          authorRole: "admin" as const,
          content: data.content,
        },
      });
      return handleResponse<{ data: JsonSerialized<RequestComment> }>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["request-comments", selectedRequest?.id] });
      setCommentText("");
    },
  });

  const handleAddComment = () => {
    if (!selectedRequest?.id || !commentText.trim()) return;
    addCommentMutation.mutate({
      requestId: selectedRequest.id,
      content: commentText.trim(),
    });
  };

  // Filter requests
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchesSearch =
        searchTerm === "" ||
        req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getCompanyById(req.companyId)?.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "all" || req.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [requests, searchTerm, filterType, getCompanyById]);

  // Group requests by status
  const requestsByStatus = useMemo(() => {
    const grouped: Record<RequestStatus, Request[]> = {
      aberta: [],
      em_andamento: [],
      concluido: [],
      cancelado: [],
    };

    for (const req of filteredRequests) {
      grouped[req.status].push(req);
    }

    // Sort each column by updatedAt descending
    for (const status of KANBAN_COLUMNS) {
      grouped[status].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    }

    return grouped;
  }, [filteredRequests]);

  const handleStatusChange = (requestId: string, newStatus: RequestStatus) => {
    updateRequestStatus(requestId, newStatus);
    // Update selected request if it's open
    if (selectedRequest?.id === requestId) {
      const updated = getRequestById(requestId);
      if (updated) setSelectedRequest(updated);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Stats
  const stats = useMemo(() => {
    return {
      total: requests.length,
      aberta: requests.filter((r) => r.status === "aberta").length,
      emAndamento: requests.filter((r) => r.status === "em_andamento").length,
      concluido: requests.filter((r) => r.status === "concluido").length,
      cancelado: requests.filter((r) => r.status === "cancelado").length,
    };
  }, [requests]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestao de Requisicoes</h1>
          <p className="text-muted-foreground mt-1">Gerencie todas as requisicoes dos clientes</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-purple-700">{stats.aberta}</div>
            <p className="text-xs text-purple-600">Aberta</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-blue-700">{stats.emAndamento}</div>
            <p className="text-xs text-blue-600">Em Andamento</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-green-700">{stats.concluido}</div>
            <p className="text-xs text-green-600">Concluída</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-red-700">{stats.cancelado}</div>
            <p className="text-xs text-red-600">Cancelada</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <Input
            placeholder="Buscar por titulo ou empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="min-w-[180px] justify-between">
              {filterType === "all" ? "Todos os tipos" : REQUEST_TYPE_LABELS[filterType]}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 ml-2"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px]">
            <DropdownMenuItem onClick={() => setFilterType("all")}>Todos os tipos</DropdownMenuItem>
            {Object.entries(REQUEST_TYPE_LABELS).map(([type, label]) => (
              <DropdownMenuItem key={type} onClick={() => setFilterType(type as RequestType)}>
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {KANBAN_COLUMNS.map((status) => (
          <div key={status} className="flex flex-col">
            {/* Column Header */}
            <div
              className={`rounded-t-lg border-2 border-b-0 px-4 py-3 ${STATUS_CONFIG[status].bgColor}`}
            >
              <div className="flex items-center justify-between">
                <h3 className={`font-semibold ${STATUS_CONFIG[status].color}`}>
                  {STATUS_CONFIG[status].label}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {requestsByStatus[status].length}
                </Badge>
              </div>
            </div>

            {/* Column Content */}
            <div className="flex-1 bg-muted/30 border-2 border-t-0 border-border rounded-b-lg p-2 min-h-[400px] space-y-2">
              {requestsByStatus[status].length === 0 ? (
                <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
                  Nenhuma requisicao
                </div>
              ) : (
                requestsByStatus[status].map((request) => (
                  <KanbanCard
                    key={request.id}
                    request={request}
                    companyName={getCompanyById(request.companyId)?.name || "Empresa desconhecida"}
                    onStatusChange={handleStatusChange}
                    onViewDetails={() => {
                      if (!request.seenByAdmin) {
                        markAsSeenByAdmin(request.id);
                      }
                      setSelectedRequest(request);
                    }}
                    formatDate={formatDate}
                    slaStatus={calculateSLAStatus(request.createdAt, request.type)}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Request Details Sheet */}
      <Sheet open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedRequest && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedRequest.title}</SheetTitle>
                <SheetDescription>Detalhes da requisicao #{selectedRequest.id}</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Status */}
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Status</span>
                  <div className="mt-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className={`w-full justify-between ${STATUS_CONFIG[selectedRequest.status].color}`}
                        >
                          {STATUS_CONFIG[selectedRequest.status].label}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 ml-2"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="m6 9 6 6 6-6" />
                          </svg>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-[200px]">
                        {KANBAN_COLUMNS.map((status) => (
                          <DropdownMenuItem
                            key={status}
                            onClick={() => handleStatusChange(selectedRequest.id, status)}
                            className={STATUS_CONFIG[status].color}
                          >
                            {STATUS_CONFIG[status].label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Type */}
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Tipo</span>
                  <p className="mt-1">{REQUEST_TYPE_LABELS[selectedRequest.type]}</p>
                </div>

                {/* Company */}
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Empresa</span>
                  <p className="mt-1">
                    {getCompanyById(selectedRequest.companyId)?.name || "Desconhecida"}
                  </p>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Criado em</span>
                    <p className="mt-1 text-sm">{formatDate(selectedRequest.createdAt)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Atualizado em</span>
                    <p className="mt-1 text-sm">{formatDate(selectedRequest.updatedAt)}</p>
                  </div>
                </div>

                {/* Data */}
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Dados</span>
                  <div className="mt-2 bg-muted rounded-lg p-4">
                    <pre className="text-xs whitespace-pre-wrap overflow-x-auto">
                      {JSON.stringify(selectedRequest.data, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Comments Section */}
                <div className="pt-4 border-t">
                  <span className="text-sm font-medium text-muted-foreground">
                    Comentarios ({comments.length})
                  </span>

                  {/* Add Comment Form */}
                  <div className="mt-3 space-y-2">
                    <Textarea
                      placeholder="Adicionar comentario para o cliente..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <Button
                      size="sm"
                      onClick={handleAddComment}
                      disabled={!commentText.trim() || addCommentMutation.isPending}
                    >
                      {addCommentMutation.isPending ? "Enviando..." : "Adicionar Comentario"}
                    </Button>
                  </div>

                  {/* Comments List */}
                  <div className="mt-4 space-y-3">
                    {isLoadingComments ? (
                      <p className="text-sm text-muted-foreground">Carregando comentarios...</p>
                    ) : comments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum comentario ainda.</p>
                    ) : (
                      comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="p-3 rounded-lg bg-muted/50 border border-border"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{comment.authorName}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-foreground whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

interface KanbanCardProps {
  request: Request;
  companyName: string;
  onStatusChange: (requestId: string, status: RequestStatus) => void;
  onViewDetails: () => void;
  formatDate: (date: string) => string;
  slaStatus: SLAStatus;
}

function KanbanCard({
  request,
  companyName,
  onStatusChange,
  onViewDetails,
  formatDate,
  slaStatus,
}: KanbanCardProps) {
  // Only show SLA for non-completed and non-cancelled requests
  const showSLA = request.status !== "concluido" && request.status !== "cancelado";

  const getSLADisplay = () => {
    if (!showSLA) return null;

    if (slaStatus.isOverdue) {
      const overdueDays = Math.abs(slaStatus.daysRemaining);
      const overdueHours = Math.abs(slaStatus.hoursRemaining) % 24;
      return {
        text:
          overdueDays > 0
            ? `${overdueDays}d ${overdueHours}h atrasado`
            : `${overdueHours}h atrasado`,
        className: "bg-red-100 text-red-700 border-red-200",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        ),
      };
    }

    if (slaStatus.isCritical) {
      return {
        text: `${slaStatus.hoursRemaining}h restantes`,
        className: "bg-red-100 text-red-700 border-red-200",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        ),
      };
    }

    if (slaStatus.isWarning) {
      return {
        text: `${slaStatus.hoursRemaining}h restantes`,
        className: "bg-amber-100 text-amber-700 border-amber-200",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        ),
      };
    }

    return {
      text: `${slaStatus.daysRemaining}d restantes`,
      className: "bg-green-100 text-green-700 border-green-200",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3 w-3"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    };
  };

  const slaDisplay = getSLADisplay();
  return (
    <Card
      className={`cursor-pointer hover:shadow-md transition-shadow group relative ${
        !request.seenByAdmin ? "ring-2 ring-primary ring-offset-2 bg-primary/5" : ""
      }`}
      onClick={onViewDetails}
    >
      {/* Indicador de nova requisicao */}
      {!request.seenByAdmin && (
        <div className="absolute -top-1.5 -right-1.5 z-10">
          <span className="flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
          </span>
        </div>
      )}
      <CardHeader className="p-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
            {request.title}
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="12" cy="5" r="1" />
                  <circle cx="12" cy="19" r="1" />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              {KANBAN_COLUMNS.filter((s) => s !== request.status).map((status) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => onStatusChange(request.id, status)}
                  className={STATUS_CONFIG[status].color}
                >
                  Mover para {STATUS_CONFIG[status].label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="space-y-2">
          <Badge variant="outline" className="text-xs font-normal">
            {REQUEST_TYPE_LABELS[request.type]}
          </Badge>
          <p className="text-xs text-muted-foreground truncate">{companyName}</p>
          {slaDisplay && (
            <div
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border ${slaDisplay.className}`}
            >
              {slaDisplay.icon}
              <span>{slaDisplay.text}</span>
            </div>
          )}
          <p className="text-xs text-muted-foreground">{formatDate(request.updatedAt)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
