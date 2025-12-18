import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../components/ui/sheet";
import { useAuth } from "../contexts/auth-context";
import {
  EMPTY_PARTY,
  type AlteracaoBLData,
  type AlteracaoDocumentoData,
  type DadosImportadorData,
  type DraftsData,
  type FichasTecnicasData,
  type PartyData,
  type PreProformaData,
  type Request,
  type RequestStatus,
  type RequestType,
  type ScheduleBookingData,
  type ScheduleProformaData,
  type TelexReleaseData,
  useRequests,
} from "../contexts/requests-context";
import { useNotifications } from "../contexts/notifications-context";

export const Route = createFileRoute("/requests")({
  component: RequestsPage,
});

function RequestsPage() {
  const { isAuthenticated, isLoading, user, isAdmin } = useAuth();
  const { getCompanyRequests, createRequest, updateRequestData, updateRequestStatus } =
    useRequests();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);

  // Get requests for user's company
  const userRequests = user?.companyId ? getCompanyRequests(user.companyId) : [];

  // Redirect to login if not authenticated or if admin
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate({ to: "/login" });
      } else if (isAdmin) {
        navigate({ to: "/" });
      }
    }
  }, [isLoading, isAuthenticated, isAdmin, navigate]);

  if (isLoading || !isAuthenticated || isAdmin) {
    return null;
  }

  const handleCreateRequest = (type: RequestType) => {
    if (!user?.companyId) return;
    const newRequest = createRequest(user.companyId, type);
    setSelectedRequest(newRequest);
    setShowNewRequestForm(true);
  };

  const getStatusLabel = (status: RequestStatus) => {
    const labels: Record<RequestStatus, string> = {
      em_andamento: "Em Andamento",
      aguardando_cliente: "Aguardando Resposta",
      concluido: "Concluido",
      cancelado: "Cancelado",
    };
    return labels[status];
  };

  const getStatusColor = (status: RequestStatus) => {
    const colors: Record<RequestStatus, string> = {
      em_andamento: "bg-blue-100 text-blue-800 border-blue-200",
      aguardando_cliente: "bg-amber-100 text-amber-800 border-amber-200",
      concluido: "bg-green-100 text-green-800 border-green-200",
      cancelado: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[status];
  };

  const getRequestDescription = (type: RequestType) => {
    const descriptions: Record<RequestType, string> = {
      pre_proforma: "Coleta de Informacoes Logisticas",
      dados_importador: "Dados do Importador e Consignee",
      schedule_proforma: "Aprovacao de Schedule e Proforma",
      fichas_tecnicas: "Fichas Tecnicas e Etiquetas",
      drafts: "Solicitacao de Drafts",
      alteracao_documento: "Alteracao de Documento",
      alteracao_bl: "Alteracao de Bill of Lading",
      schedule_booking: "Schedule do Booking",
      telex_release: "Liberacao Telex Release",
      documento: "Solicitacao de Documento",
      embarque: "Acompanhamento de Embarque",
      financeiro: "Solicitacao Financeira",
    };
    return descriptions[type];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Stats
  const stats = {
    total: userRequests.length,
    emAndamento: userRequests.filter((r) => r.status === "em_andamento").length,
    concluidas: userRequests.filter((r) => r.status === "concluido").length,
  };

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Requisicoes</h1>
          <p className="text-muted-foreground">
            Acompanhe suas requisicoes e inicie novas solicitacoes.
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Nova Requisicao
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-2">
            {/* Pre-Embarque */}
            <div className="flex items-center gap-2 px-2 py-2 mb-1">
              <div className="h-6 w-6 rounded-md bg-blue-100 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5 text-blue-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                Pre-Embarque
              </span>
            </div>
            <DropdownMenuItem
              onClick={() => handleCreateRequest("pre_proforma")}
              className="cursor-pointer rounded-lg py-3 px-3 focus:bg-blue-50"
            >
              <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center mr-3 shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-slate-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground">Pre-Proforma</p>
                <p className="text-xs text-muted-foreground">Informacoes logisticas</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleCreateRequest("dados_importador")}
              className="cursor-pointer rounded-lg py-3 px-3 focus:bg-blue-50"
            >
              <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center mr-3 shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-slate-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground">Dados Importador</p>
                <p className="text-xs text-muted-foreground">Importer, Consignee e Notify</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleCreateRequest("schedule_proforma")}
              className="cursor-pointer rounded-lg py-3 px-3 focus:bg-blue-50"
            >
              <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center mr-3 shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-slate-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                  <path d="m9 16 2 2 4-4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground">Schedule e Proforma</p>
                <p className="text-xs text-muted-foreground">Aprovacao de embarque</p>
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-2" />

            {/* Documentos */}
            <div className="flex items-center gap-2 px-2 py-2 mb-1">
              <div className="h-6 w-6 rounded-md bg-emerald-100 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5 text-emerald-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
                Documentos
              </span>
            </div>
            <DropdownMenuItem
              onClick={() => handleCreateRequest("fichas_tecnicas")}
              className="cursor-pointer rounded-lg py-3 px-3 focus:bg-emerald-50"
            >
              <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center mr-3 shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-slate-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  <line x1="8" y1="7" x2="16" y2="7" />
                  <line x1="8" y1="11" x2="16" y2="11" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground">Fichas Tecnicas</p>
                <p className="text-xs text-muted-foreground">Fichas e etiquetas</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleCreateRequest("drafts")}
              className="cursor-pointer rounded-lg py-3 px-3 focus:bg-emerald-50"
            >
              <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center mr-3 shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-slate-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground">Drafts</p>
                <p className="text-xs text-muted-foreground">Solicitar drafts do contrato</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleCreateRequest("schedule_booking")}
              className="cursor-pointer rounded-lg py-3 px-3 focus:bg-emerald-50"
            >
              <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center mr-3 shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-slate-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground">Schedule do Booking</p>
                <p className="text-xs text-muted-foreground">Dados do booking</p>
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-2" />

            {/* Alteracoes */}
            <div className="flex items-center gap-2 px-2 py-2 mb-1">
              <div className="h-6 w-6 rounded-md bg-amber-100 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5 text-amber-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide">
                Alteracoes
              </span>
            </div>
            <DropdownMenuItem
              onClick={() => handleCreateRequest("alteracao_documento")}
              className="cursor-pointer rounded-lg py-3 px-3 focus:bg-amber-50"
            >
              <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center mr-3 shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-slate-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="M12 18v-6" />
                  <path d="m9 15 3 3 3-3" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground">Alteracao de Documento</p>
                <p className="text-xs text-muted-foreground">Invoice, Packing List, etc.</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleCreateRequest("alteracao_bl")}
              className="cursor-pointer rounded-lg py-3 px-3 focus:bg-amber-50"
            >
              <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center mr-3 shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-slate-600"
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
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground">Alteracao de BL</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Pode gerar custo
                </p>
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-2" />

            {/* Liberacao */}
            <div className="flex items-center gap-2 px-2 py-2 mb-1">
              <div className="h-6 w-6 rounded-md bg-purple-100 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5 text-purple-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">
                Liberacao
              </span>
            </div>
            <DropdownMenuItem
              onClick={() => handleCreateRequest("telex_release")}
              className="cursor-pointer rounded-lg py-3 px-3 focus:bg-purple-50"
            >
              <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center mr-3 shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-slate-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground">Telex Release</p>
                <p className="text-xs text-muted-foreground">Liberacao de carga</p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Requisicoes</p>
                <p className="text-3xl font-bold text-foreground">{stats.total}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-primary"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Em Andamento</p>
                <p className="text-3xl font-bold text-foreground">{stats.emAndamento}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-blue-600"
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
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Concluidas</p>
                <p className="text-3xl font-bold text-foreground">{stats.concluidas}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-green-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Minhas Requisicoes</CardTitle>
          <CardDescription>
            {userRequests.length} requisicao{userRequests.length !== 1 ? "es" : ""} encontrada
            {userRequests.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {userRequests.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <p className="text-muted-foreground mb-4">Nenhuma requisicao encontrada.</p>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">Criar primeira requisicao</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-72 max-h-80 overflow-y-auto">
                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                      Pre-Embarque
                    </DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => handleCreateRequest("pre_proforma")}
                      className="cursor-pointer"
                    >
                      <div>
                        <p className="font-medium">Pre-Proforma</p>
                        <p className="text-xs text-muted-foreground">Informacoes logisticas</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleCreateRequest("dados_importador")}
                      className="cursor-pointer"
                    >
                      <div>
                        <p className="font-medium">Dados Importador</p>
                        <p className="text-xs text-muted-foreground">
                          Importer, Consignee e Notify
                        </p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleCreateRequest("schedule_proforma")}
                      className="cursor-pointer"
                    >
                      <div>
                        <p className="font-medium">Schedule e Proforma</p>
                        <p className="text-xs text-muted-foreground">Aprovacao de embarque</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                      Documentos
                    </DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => handleCreateRequest("fichas_tecnicas")}
                      className="cursor-pointer"
                    >
                      <div>
                        <p className="font-medium">Fichas Tecnicas</p>
                        <p className="text-xs text-muted-foreground">Fichas e etiquetas</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleCreateRequest("drafts")}
                      className="cursor-pointer"
                    >
                      <div>
                        <p className="font-medium">Drafts</p>
                        <p className="text-xs text-muted-foreground">Solicitar drafts</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleCreateRequest("schedule_booking")}
                      className="cursor-pointer"
                    >
                      <div>
                        <p className="font-medium">Schedule do Booking</p>
                        <p className="text-xs text-muted-foreground">Dados do booking</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                      Alteracoes
                    </DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => handleCreateRequest("alteracao_documento")}
                      className="cursor-pointer"
                    >
                      <div>
                        <p className="font-medium">Alteracao de Documento</p>
                        <p className="text-xs text-muted-foreground">Invoice, Packing List</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleCreateRequest("alteracao_bl")}
                      className="cursor-pointer"
                    >
                      <div>
                        <p className="font-medium">Alteracao de BL</p>
                        <p className="text-xs text-muted-foreground">Pode gerar custo</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                      Liberacao
                    </DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => handleCreateRequest("telex_release")}
                      className="cursor-pointer"
                    >
                      <div>
                        <p className="font-medium">Telex Release</p>
                        <p className="text-xs text-muted-foreground">Liberacao de carga</p>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              userRequests.map((request) => (
                <button
                  type="button"
                  key={request.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer w-full text-left"
                  onClick={() => {
                    setSelectedRequest(request);
                    setShowNewRequestForm(false);
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        request.status === "concluido"
                          ? "bg-green-100 text-green-600"
                          : request.status === "em_andamento"
                            ? "bg-blue-100 text-blue-600"
                            : "bg-amber-100 text-amber-600"
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{request.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Criado em {formatDate(request.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={`${getStatusColor(request.status)} border`}>
                      {getStatusLabel(request.status)}
                    </Badge>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-muted-foreground"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Request Detail / Form Sheet */}
      <Sheet
        open={!!selectedRequest}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRequest(null);
            setShowNewRequestForm(false);
          }
        }}
      >
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedRequest && (
            <>
              <SheetHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      selectedRequest.status === "concluido"
                        ? "bg-green-100 text-green-600"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {selectedRequest.type === "dados_importador" ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <SheetTitle className="text-left">{selectedRequest.title}</SheetTitle>
                    <SheetDescription className="text-left">
                      {getRequestDescription(selectedRequest.type)}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              {showNewRequestForm || selectedRequest.status === "em_andamento" ? (
                <RequestForm
                  request={selectedRequest}
                  onUpdateData={(data) => updateRequestData(selectedRequest.id, data)}
                  onComplete={() => {
                    updateRequestStatus(selectedRequest.id, "concluido");
                    addNotification({
                      title: "Requisicao Enviada",
                      message: `${selectedRequest.title} foi enviada com sucesso`,
                      type: "request_status",
                      requestId: selectedRequest.id,
                      requestType: selectedRequest.type,
                    });
                    setShowNewRequestForm(false);
                  }}
                  onCancel={() => {
                    setSelectedRequest(null);
                    setShowNewRequestForm(false);
                  }}
                />
              ) : (
                <RequestSummary request={selectedRequest} />
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Router component for forms
interface RequestFormProps {
  request: Request;
  onUpdateData: (data: Partial<RequestData>) => void;
  onComplete: () => void;
  onCancel: () => void;
}

type RequestData =
  | PreProformaData
  | DadosImportadorData
  | ScheduleProformaData
  | FichasTecnicasData
  | DraftsData
  | AlteracaoDocumentoData
  | AlteracaoBLData
  | ScheduleBookingData
  | TelexReleaseData;

function RequestForm({ request, onUpdateData, onComplete, onCancel }: RequestFormProps) {
  switch (request.type) {
    case "pre_proforma":
      return (
        <PreProformaForm
          request={request}
          onUpdateData={onUpdateData}
          onComplete={onComplete}
          onCancel={onCancel}
        />
      );
    case "dados_importador":
      return (
        <DadosImportadorForm
          request={request}
          onUpdateData={onUpdateData}
          onComplete={onComplete}
          onCancel={onCancel}
        />
      );
    case "schedule_proforma":
      return (
        <ScheduleProformaForm
          request={request}
          onUpdateData={onUpdateData}
          onComplete={onComplete}
          onCancel={onCancel}
        />
      );
    case "fichas_tecnicas":
      return (
        <FichasTecnicasForm
          request={request}
          onUpdateData={onUpdateData}
          onComplete={onComplete}
          onCancel={onCancel}
        />
      );
    case "drafts":
      return (
        <DraftsForm
          request={request}
          onUpdateData={onUpdateData}
          onComplete={onComplete}
          onCancel={onCancel}
        />
      );
    case "alteracao_documento":
      return (
        <AlteracaoDocumentoForm
          request={request}
          onUpdateData={onUpdateData}
          onComplete={onComplete}
          onCancel={onCancel}
        />
      );
    case "alteracao_bl":
      return (
        <AlteracaoBLForm
          request={request}
          onUpdateData={onUpdateData}
          onComplete={onComplete}
          onCancel={onCancel}
        />
      );
    case "schedule_booking":
      return (
        <ScheduleBookingForm
          request={request}
          onUpdateData={onUpdateData}
          onComplete={onComplete}
          onCancel={onCancel}
        />
      );
    case "telex_release":
      return (
        <TelexReleaseForm
          request={request}
          onUpdateData={onUpdateData}
          onComplete={onComplete}
          onCancel={onCancel}
        />
      );
    default:
      return <div className="text-center py-8 text-muted-foreground">Em desenvolvimento</div>;
  }
}

// Router component for summaries
function RequestSummary({ request }: { request: Request }) {
  switch (request.type) {
    case "pre_proforma":
      return <PreProformaSummary request={request} />;
    case "dados_importador":
      return <DadosImportadorSummary request={request} />;
    case "schedule_proforma":
      return <ScheduleProformaSummary request={request} />;
    case "fichas_tecnicas":
      return <FichasTecnicasSummary request={request} />;
    case "drafts":
      return <DraftsSummary request={request} />;
    case "alteracao_documento":
      return <AlteracaoDocumentoSummary request={request} />;
    case "alteracao_bl":
      return <AlteracaoBLSummary request={request} />;
    case "schedule_booking":
      return <ScheduleBookingSummary request={request} />;
    case "telex_release":
      return <TelexReleaseSummary request={request} />;
    default:
      return <div className="text-center py-8 text-muted-foreground">Resumo indisponivel</div>;
  }
}

// Pre-Proforma Form Component
interface PreProformaFormProps {
  request: Request;
  onUpdateData: (data: Partial<PreProformaData>) => void;
  onComplete: () => void;
  onCancel: () => void;
}

function PreProformaForm({ request, onUpdateData, onComplete, onCancel }: PreProformaFormProps) {
  const data = request.data as PreProformaData;

  const [formData, setFormData] = useState({
    paletizacao: data.paletizacao ?? null,
    restricaoArmador: data.restricaoArmador?.has ?? null,
    restricaoArmadorValue: data.restricaoArmador?.value ?? "",
    limitePeso: data.limitePeso?.has ?? null,
    limitePesoValue: data.limitePeso?.value ?? "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (formData.paletizacao === null) return;
    if (formData.restricaoArmador === null) return;
    if (formData.limitePeso === null) return;
    if (formData.restricaoArmador && !formData.restricaoArmadorValue.trim()) return;
    if (formData.limitePeso && !formData.limitePesoValue.trim()) return;

    onUpdateData({
      paletizacao: formData.paletizacao,
      restricaoArmador: {
        has: formData.restricaoArmador,
        value: formData.restricaoArmadorValue,
      },
      limitePeso: {
        has: formData.limitePeso,
        value: formData.limitePesoValue,
      },
    });

    onComplete();
  };

  const isValid =
    formData.paletizacao !== null &&
    formData.restricaoArmador !== null &&
    formData.limitePeso !== null &&
    (!formData.restricaoArmador || formData.restricaoArmadorValue.trim()) &&
    (!formData.limitePeso || formData.limitePesoValue.trim());

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <div>
            <p className="text-sm font-medium text-blue-800">Etapa Pre-Proforma</p>
            <p className="text-sm text-blue-700 mt-1">
              Confirme as informacoes logisticas antes da emissao da proforma. Esses pontos impactam
              diretamente a estrutura do embarque.
            </p>
          </div>
        </div>
      </div>

      {/* Question 1: Paletizacao */}
      <div className="space-y-3">
        <Label className="text-base font-medium">1. O contrato exige paletizacao?</Label>
        <div className="flex gap-3">
          <Button
            type="button"
            variant={formData.paletizacao === true ? "default" : "outline"}
            className={`flex-1 ${formData.paletizacao === true ? "" : "hover:bg-muted"}`}
            onClick={() => setFormData({ ...formData, paletizacao: true })}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Sim
          </Button>
          <Button
            type="button"
            variant={formData.paletizacao === false ? "default" : "outline"}
            className={`flex-1 ${formData.paletizacao === false ? "" : "hover:bg-muted"}`}
            onClick={() => setFormData({ ...formData, paletizacao: false })}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Nao
          </Button>
        </div>
      </div>

      {/* Question 2: Restricao de Armador */}
      <div className="space-y-3">
        <Label className="text-base font-medium">2. Ha alguma restricao de armador?</Label>
        <div className="flex gap-3">
          <Button
            type="button"
            variant={formData.restricaoArmador === true ? "default" : "outline"}
            className={`flex-1 ${formData.restricaoArmador === true ? "" : "hover:bg-muted"}`}
            onClick={() => setFormData({ ...formData, restricaoArmador: true })}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Sim
          </Button>
          <Button
            type="button"
            variant={formData.restricaoArmador === false ? "default" : "outline"}
            className={`flex-1 ${formData.restricaoArmador === false ? "" : "hover:bg-muted"}`}
            onClick={() =>
              setFormData({ ...formData, restricaoArmador: false, restricaoArmadorValue: "" })
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Nao
          </Button>
        </div>
        {formData.restricaoArmador === true && (
          <div className="pt-2">
            <Label htmlFor="armador-input" className="text-sm text-muted-foreground">
              Qual armador?
            </Label>
            <Input
              id="armador-input"
              value={formData.restricaoArmadorValue}
              onChange={(e) => setFormData({ ...formData, restricaoArmadorValue: e.target.value })}
              placeholder="Ex: MSC, Maersk, Hapag-Lloyd..."
              className="mt-1"
            />
          </div>
        )}
      </div>

      {/* Question 3: Limite de Peso */}
      <div className="space-y-3">
        <Label className="text-base font-medium">
          3. Existe limite de peso por container no destino?
        </Label>
        <div className="flex gap-3">
          <Button
            type="button"
            variant={formData.limitePeso === true ? "default" : "outline"}
            className={`flex-1 ${formData.limitePeso === true ? "" : "hover:bg-muted"}`}
            onClick={() => setFormData({ ...formData, limitePeso: true })}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Sim
          </Button>
          <Button
            type="button"
            variant={formData.limitePeso === false ? "default" : "outline"}
            className={`flex-1 ${formData.limitePeso === false ? "" : "hover:bg-muted"}`}
            onClick={() => setFormData({ ...formData, limitePeso: false, limitePesoValue: "" })}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Nao
          </Button>
        </div>
        {formData.limitePeso === true && (
          <div className="pt-2">
            <Label htmlFor="peso-input" className="text-sm text-muted-foreground">
              Qual o limite em kg?
            </Label>
            <Input
              id="peso-input"
              type="number"
              value={formData.limitePesoValue}
              onChange={(e) => setFormData({ ...formData, limitePesoValue: e.target.value })}
              placeholder="Ex: 25000"
              className="mt-1"
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" disabled={!isValid} className="flex-1">
          Enviar Requisicao
        </Button>
      </div>
    </form>
  );
}

// Pre-Proforma Summary Component (for completed requests)
function PreProformaSummary({ request }: { request: Request }) {
  const data = request.data as PreProformaData;

  return (
    <div className="space-y-6">
      {/* Completed Banner */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-green-600 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <div>
            <p className="text-sm font-medium text-green-800">Requisicao Concluida</p>
            <p className="text-sm text-green-700 mt-1">
              Sua proforma sera estruturada com base nas informacoes abaixo.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Items */}
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
          <div
            className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              data.paletizacao ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"
            }`}
          >
            {data.paletizacao ? (
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
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
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
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            )}
          </div>
          <div>
            <p className="font-medium text-foreground">Paletizacao</p>
            <p className="text-sm text-muted-foreground">
              {data.paletizacao ? "Carga paletizada" : "Sem paletizacao"}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
          <div
            className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              data.restricaoArmador?.has
                ? "bg-amber-100 text-amber-600"
                : "bg-green-100 text-green-600"
            }`}
          >
            {data.restricaoArmador?.has ? (
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
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            ) : (
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
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
          <div>
            <p className="font-medium text-foreground">Restricao de Armador</p>
            <p className="text-sm text-muted-foreground">
              {data.restricaoArmador?.has
                ? `Restricao: ${data.restricaoArmador.value}`
                : "Sem restricao de armador"}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
          <div
            className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              data.limitePeso?.has ? "bg-amber-100 text-amber-600" : "bg-green-100 text-green-600"
            }`}
          >
            {data.limitePeso?.has ? (
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
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            ) : (
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
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
          <div>
            <p className="font-medium text-foreground">Limite de Peso</p>
            <p className="text-sm text-muted-foreground">
              {data.limitePeso?.has
                ? `Maximo de ${Number(data.limitePeso.value).toLocaleString("pt-BR")} kg/container`
                : "Sem limite de peso"}
            </p>
          </div>
        </div>
      </div>

      {/* Timestamp */}
      <div className="pt-4 border-t">
        <p className="text-xs text-muted-foreground text-center">
          Concluida em{" "}
          {new Date(request.updatedAt).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

// Dados Importador Form Component
interface DadosImportadorFormProps {
  request: Request;
  onUpdateData: (data: Partial<DadosImportadorData>) => void;
  onComplete: () => void;
  onCancel: () => void;
}

function DadosImportadorForm({
  request,
  onUpdateData,
  onComplete,
  onCancel,
}: DadosImportadorFormProps) {
  const data = request.data as DadosImportadorData;

  const [formData, setFormData] = useState({
    importer: data.importer ?? { ...EMPTY_PARTY },
    consigneeBL: data.consigneeBL ?? { ...EMPTY_PARTY },
    consigneeHC: data.consigneeHC ?? { ...EMPTY_PARTY },
    notifyParty: data.notifyParty ?? { ...EMPTY_PARTY },
  });

  const updateParty = (party: keyof typeof formData, field: keyof PartyData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [party]: {
        ...prev[party],
        [field]: value,
      },
    }));
  };

  const isPartyValid = (party: PartyData) => {
    return party.companyName.trim() !== "" && party.email.trim() !== "";
  };

  const isValid =
    isPartyValid(formData.importer) &&
    isPartyValid(formData.consigneeBL) &&
    isPartyValid(formData.consigneeHC) &&
    isPartyValid(formData.notifyParty);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    onUpdateData(formData);
    onComplete();
  };

  const renderPartyForm = (
    title: string,
    partyKey: keyof typeof formData,
    icon: React.ReactNode
  ) => {
    const party = formData[partyKey];

    return (
      <div className="space-y-4 p-4 rounded-lg border border-border bg-muted/30">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-semibold text-foreground">{title}</h3>
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor={`${partyKey}-companyName`} className="text-sm">
              Company Name *
            </Label>
            <Input
              id={`${partyKey}-companyName`}
              value={party.companyName}
              onChange={(e) => updateParty(partyKey, "companyName", e.target.value)}
              placeholder="Nome da empresa"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor={`${partyKey}-address`} className="text-sm">
              Address
            </Label>
            <Input
              id={`${partyKey}-address`}
              value={party.address}
              onChange={(e) => updateParty(partyKey, "address", e.target.value)}
              placeholder="Endereco completo"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor={`${partyKey}-contactPerson`} className="text-sm">
              Contact Person
            </Label>
            <Input
              id={`${partyKey}-contactPerson`}
              value={party.contactPerson}
              onChange={(e) => updateParty(partyKey, "contactPerson", e.target.value)}
              placeholder="Pessoa de contato"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor={`${partyKey}-phone`} className="text-sm">
                Phone Number
              </Label>
              <Input
                id={`${partyKey}-phone`}
                value={party.phone}
                onChange={(e) => updateParty(partyKey, "phone", e.target.value)}
                placeholder="(00) 0000-0000"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor={`${partyKey}-email`} className="text-sm">
                E-mail *
              </Label>
              <Input
                id={`${partyKey}-email`}
                type="email"
                value={party.email}
                onChange={(e) => updateParty(partyKey, "email", e.target.value)}
                placeholder="email@empresa.com"
                className="mt-1"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <div>
            <p className="text-sm font-medium text-blue-800">Coleta de Dados</p>
            <p className="text-sm text-blue-700 mt-1">
              Preencha os dados das partes envolvidas no embarque. Os campos marcados com * sao
              obrigatorios.
            </p>
          </div>
        </div>
      </div>

      {/* Importer Section */}
      {renderPartyForm(
        "IMPORTER",
        "importer",
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-primary"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )}

      {/* Consignee BL Section */}
      {renderPartyForm(
        "CONSIGNEE BL",
        "consigneeBL",
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-primary"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      )}

      {/* Consignee HC Section */}
      {renderPartyForm(
        "CONSIGNEE HC",
        "consigneeHC",
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-primary"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      )}

      {/* Notify Party Section */}
      {renderPartyForm(
        "NOTIFY PARTY",
        "notifyParty",
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-primary"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" disabled={!isValid} className="flex-1">
          Enviar Requisicao
        </Button>
      </div>
    </form>
  );
}

// Dados Importador Summary Component (for completed requests)
function DadosImportadorSummary({ request }: { request: Request }) {
  const data = request.data as DadosImportadorData;

  const renderPartySummary = (title: string, party: PartyData | null, icon: React.ReactNode) => {
    if (!party) return null;

    return (
      <div className="p-4 rounded-lg bg-muted/50">
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <h4 className="font-semibold text-foreground">{title}</h4>
        </div>
        <div className="space-y-1 text-sm">
          <p className="font-medium text-foreground">{party.companyName}</p>
          {party.address && <p className="text-muted-foreground">{party.address}</p>}
          {party.contactPerson && (
            <p className="text-muted-foreground">Contato: {party.contactPerson}</p>
          )}
          <div className="flex gap-4 mt-2">
            {party.phone && <p className="text-muted-foreground">{party.phone}</p>}
            {party.email && <p className="text-primary">{party.email}</p>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Completed Banner */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-green-600 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <div>
            <p className="text-sm font-medium text-green-800">Dados Cadastrados</p>
            <p className="text-sm text-green-700 mt-1">
              Os dados das partes foram registrados com sucesso.
            </p>
          </div>
        </div>
      </div>

      {/* Party Summaries */}
      <div className="space-y-4">
        {renderPartySummary(
          "IMPORTER",
          data.importer,
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-primary"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        )}

        {renderPartySummary(
          "CONSIGNEE BL",
          data.consigneeBL,
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-primary"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        )}

        {renderPartySummary(
          "CONSIGNEE HC",
          data.consigneeHC,
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-primary"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
        )}

        {renderPartySummary(
          "NOTIFY PARTY",
          data.notifyParty,
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-primary"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        )}
      </div>

      {/* Timestamp */}
      <div className="pt-4 border-t">
        <p className="text-xs text-muted-foreground text-center">
          Concluida em{" "}
          {new Date(request.updatedAt).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

// Schedule Proforma Form Component
interface ScheduleProformaFormProps {
  request: Request;
  onUpdateData: (data: Partial<ScheduleProformaData>) => void;
  onComplete: () => void;
  onCancel: () => void;
}

function ScheduleProformaForm({
  request,
  onUpdateData,
  onComplete,
  onCancel,
}: ScheduleProformaFormProps) {
  const data = request.data as ScheduleProformaData;

  const [formData, setFormData] = useState({
    navio: data.navio || "",
    portoEmbarque: data.portoEmbarque || "",
    portoDestino: data.portoDestino || "",
    eta: data.eta || "",
    pesoContainer: data.pesoContainer || "",
    paletizado: data.paletizado,
    aprovado: data.aprovado,
    observacoes: data.observacoes || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.aprovado === null) return;
    onUpdateData(formData);
    onComplete();
  };

  const isValid = formData.aprovado !== null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm font-medium text-blue-800">Schedule e Proforma</p>
        <p className="text-sm text-blue-700 mt-1">
          Revise as informacoes do embarque e confirme sua aprovacao.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sp-navio" className="text-sm">
              Navio
            </Label>
            <Input
              id="sp-navio"
              value={formData.navio}
              onChange={(e) => setFormData({ ...formData, navio: e.target.value })}
              placeholder="Ex: MSC BIANCA"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="sp-eta" className="text-sm">
              ETA
            </Label>
            <Input
              id="sp-eta"
              type="date"
              value={formData.eta}
              onChange={(e) => setFormData({ ...formData, eta: e.target.value })}
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sp-portoEmbarque" className="text-sm">
              Porto de Embarque
            </Label>
            <Input
              id="sp-portoEmbarque"
              value={formData.portoEmbarque}
              onChange={(e) => setFormData({ ...formData, portoEmbarque: e.target.value })}
              placeholder="Ex: Vila do Conde"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="sp-portoDestino" className="text-sm">
              Porto de Destino
            </Label>
            <Input
              id="sp-portoDestino"
              value={formData.portoDestino}
              onChange={(e) => setFormData({ ...formData, portoDestino: e.target.value })}
              placeholder="Ex: Jebel Ali"
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sp-peso" className="text-sm">
              Peso por Container (kg)
            </Label>
            <Input
              id="sp-peso"
              type="number"
              value={formData.pesoContainer}
              onChange={(e) => setFormData({ ...formData, pesoContainer: e.target.value })}
              placeholder="Ex: 25000"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm">Paletizado</Label>
            <div className="flex gap-2 mt-1">
              <Button
                type="button"
                variant={formData.paletizado === true ? "default" : "outline"}
                size="sm"
                onClick={() => setFormData({ ...formData, paletizado: true })}
              >
                Sim
              </Button>
              <Button
                type="button"
                variant={formData.paletizado === false ? "default" : "outline"}
                size="sm"
                onClick={() => setFormData({ ...formData, paletizado: false })}
              >
                Nao
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t">
        <Label className="text-base font-medium">Voce confirma o aceite dessas informacoes?</Label>
        <div className="flex gap-3">
          <Button
            type="button"
            variant={formData.aprovado === true ? "default" : "outline"}
            className="flex-1"
            onClick={() => setFormData({ ...formData, aprovado: true })}
          >
            Sim, aprovado
          </Button>
          <Button
            type="button"
            variant={formData.aprovado === false ? "default" : "outline"}
            className="flex-1"
            onClick={() => setFormData({ ...formData, aprovado: false })}
          >
            Solicitar ajustes
          </Button>
        </div>
        {formData.aprovado === false && (
          <div className="pt-2">
            <Label htmlFor="sp-obs" className="text-sm">
              Observacoes
            </Label>
            <Input
              id="sp-obs"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Descreva os ajustes necessarios..."
              className="mt-1"
            />
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" disabled={!isValid} className="flex-1">
          Enviar
        </Button>
      </div>
    </form>
  );
}

// Fichas Tecnicas Form Component
function FichasTecnicasForm({
  request,
  onUpdateData,
  onComplete,
  onCancel,
}: {
  request: Request;
  onUpdateData: (data: Partial<FichasTecnicasData>) => void;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const data = request.data as FichasTecnicasData;
  const [formData, setFormData] = useState({
    proformaRef: data.proformaRef || "",
    solicitarEtiquetas: data.solicitarEtiquetas,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.proformaRef.trim() || formData.solicitarEtiquetas === null) return;
    onUpdateData({ ...formData, produtos: [] });
    onComplete();
  };

  const isValid = formData.proformaRef.trim() !== "" && formData.solicitarEtiquetas !== null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm font-medium text-blue-800">Fichas Tecnicas e Etiquetas</p>
        <p className="text-sm text-blue-700 mt-1">
          Solicite fichas tecnicas dos produtos da sua proforma.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="ft-ref" className="text-sm">
            Referencia da Proforma *
          </Label>
          <Input
            id="ft-ref"
            value={formData.proformaRef}
            onChange={(e) => setFormData({ ...formData, proformaRef: e.target.value })}
            placeholder="Ex: MB251/25"
            className="mt-1"
          />
        </div>
        <div className="space-y-3">
          <Label className="text-base font-medium">Deseja tambem as etiquetas?</Label>
          <div className="flex gap-3">
            <Button
              type="button"
              variant={formData.solicitarEtiquetas === true ? "default" : "outline"}
              className="flex-1"
              onClick={() => setFormData({ ...formData, solicitarEtiquetas: true })}
            >
              Sim
            </Button>
            <Button
              type="button"
              variant={formData.solicitarEtiquetas === false ? "default" : "outline"}
              className="flex-1"
              onClick={() => setFormData({ ...formData, solicitarEtiquetas: false })}
            >
              Nao
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" disabled={!isValid} className="flex-1">
          Solicitar
        </Button>
      </div>
    </form>
  );
}

// Drafts Form Component
function DraftsForm({
  request,
  onUpdateData,
  onComplete,
  onCancel,
}: {
  request: Request;
  onUpdateData: (data: Partial<DraftsData>) => void;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const data = request.data as DraftsData;
  const [formData, setFormData] = useState({
    contratoRef: data.contratoRef || "",
    metodoEnvio: data.metodoEnvio,
    emailDestino: data.emailDestino || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.contratoRef.trim() || !formData.metodoEnvio) return;
    if (formData.metodoEnvio === "email" && !formData.emailDestino.trim()) return;
    onUpdateData(formData);
    onComplete();
  };

  const isValid =
    formData.contratoRef.trim() !== "" &&
    formData.metodoEnvio !== null &&
    (formData.metodoEnvio !== "email" || formData.emailDestino.trim() !== "");

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm font-medium text-blue-800">Solicitacao de Drafts</p>
        <p className="text-sm text-blue-700 mt-1">Receba os drafts do contrato para revisao.</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="dr-ref" className="text-sm">
            Referencia do Contrato *
          </Label>
          <Input
            id="dr-ref"
            value={formData.contratoRef}
            onChange={(e) => setFormData({ ...formData, contratoRef: e.target.value })}
            placeholder="Ex: MB251/25"
            className="mt-1"
          />
        </div>
        <div className="space-y-3">
          <Label className="text-base font-medium">Voce deseja:</Label>
          <div className="flex gap-3">
            <Button
              type="button"
              variant={formData.metodoEnvio === "download" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setFormData({ ...formData, metodoEnvio: "download" })}
            >
              Baixar aqui
            </Button>
            <Button
              type="button"
              variant={formData.metodoEnvio === "email" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setFormData({ ...formData, metodoEnvio: "email" })}
            >
              Enviar por e-mail
            </Button>
          </div>
          {formData.metodoEnvio === "email" && (
            <Input
              id="dr-email"
              type="email"
              value={formData.emailDestino}
              onChange={(e) => setFormData({ ...formData, emailDestino: e.target.value })}
              placeholder="email@empresa.com"
              className="mt-2"
            />
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" disabled={!isValid} className="flex-1">
          Solicitar
        </Button>
      </div>
    </form>
  );
}

// Alteracao Documento Form Component
function AlteracaoDocumentoForm({
  request,
  onUpdateData,
  onComplete,
  onCancel,
}: {
  request: Request;
  onUpdateData: (data: Partial<AlteracaoDocumentoData>) => void;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const data = request.data as AlteracaoDocumentoData;
  const [formData, setFormData] = useState({
    contratoRef: data.contratoRef || "",
    tipoDocumento: data.tipoDocumento || "",
    campoCorrigir: data.campoCorrigir || "",
    descricaoAlteracao: data.descricaoAlteracao || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.contratoRef.trim() ||
      !formData.tipoDocumento.trim() ||
      !formData.descricaoAlteracao.trim()
    )
      return;
    onUpdateData(formData);
    onComplete();
  };

  const isValid =
    formData.contratoRef.trim() !== "" &&
    formData.tipoDocumento.trim() !== "" &&
    formData.descricaoAlteracao.trim() !== "";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm font-medium text-amber-800">Alteracao de Documento</p>
        <p className="text-sm text-amber-700 mt-1">Solicite alteracoes em documentos.</p>
      </div>
      <div className="space-y-4">
        <div>
          <Label htmlFor="ad-ref" className="text-sm">
            Contrato *
          </Label>
          <Input
            id="ad-ref"
            value={formData.contratoRef}
            onChange={(e) => setFormData({ ...formData, contratoRef: e.target.value })}
            placeholder="Ex: MB251/25"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="ad-tipo" className="text-sm">
            Tipo de Documento *
          </Label>
          <Input
            id="ad-tipo"
            value={formData.tipoDocumento}
            onChange={(e) => setFormData({ ...formData, tipoDocumento: e.target.value })}
            placeholder="Ex: Invoice"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="ad-campo" className="text-sm">
            Campo a Corrigir
          </Label>
          <Input
            id="ad-campo"
            value={formData.campoCorrigir}
            onChange={(e) => setFormData({ ...formData, campoCorrigir: e.target.value })}
            placeholder="Ex: Endereco"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="ad-desc" className="text-sm">
            Descricao *
          </Label>
          <Input
            id="ad-desc"
            value={formData.descricaoAlteracao}
            onChange={(e) => setFormData({ ...formData, descricaoAlteracao: e.target.value })}
            placeholder="Descreva a alteracao"
            className="mt-1"
          />
        </div>
      </div>
      <div className="flex gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" disabled={!isValid} className="flex-1">
          Solicitar
        </Button>
      </div>
    </form>
  );
}

// Alteracao BL Form Component
function AlteracaoBLForm({
  request,
  onUpdateData,
  onComplete,
  onCancel,
}: {
  request: Request;
  onUpdateData: (data: Partial<AlteracaoBLData>) => void;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const data = request.data as AlteracaoBLData;
  const [formData, setFormData] = useState({
    contratoRef: data.contratoRef || "",
    descricaoAlteracao: data.descricaoAlteracao || "",
    aceitaCusto: data.aceitaCusto,
    custoEstimado: data.custoEstimado || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.contratoRef.trim() ||
      !formData.descricaoAlteracao.trim() ||
      formData.aceitaCusto === null
    )
      return;
    onUpdateData(formData);
    onComplete();
  };

  const isValid =
    formData.contratoRef.trim() !== "" &&
    formData.descricaoAlteracao.trim() !== "" &&
    formData.aceitaCusto !== null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm font-medium text-amber-800">Alteracao de B/L</p>
        <p className="text-sm text-amber-700 mt-1">Esta solicitacao pode gerar custo.</p>
      </div>
      <div className="space-y-4">
        <div>
          <Label htmlFor="abl-ref" className="text-sm">
            Contrato *
          </Label>
          <Input
            id="abl-ref"
            value={formData.contratoRef}
            onChange={(e) => setFormData({ ...formData, contratoRef: e.target.value })}
            placeholder="Ex: MB251/25"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="abl-desc" className="text-sm">
            Descricao *
          </Label>
          <Input
            id="abl-desc"
            value={formData.descricaoAlteracao}
            onChange={(e) => setFormData({ ...formData, descricaoAlteracao: e.target.value })}
            placeholder="Ex: Alterar consignatario"
            className="mt-1"
          />
        </div>
        <div className="space-y-3">
          <Label className="text-base font-medium">Deseja seguir mesmo assim?</Label>
          <div className="flex gap-3">
            <Button
              type="button"
              variant={formData.aceitaCusto === true ? "default" : "outline"}
              className="flex-1"
              onClick={() => setFormData({ ...formData, aceitaCusto: true })}
            >
              Sim
            </Button>
            <Button
              type="button"
              variant={formData.aceitaCusto === false ? "default" : "outline"}
              className="flex-1"
              onClick={() => setFormData({ ...formData, aceitaCusto: false })}
            >
              Nao
            </Button>
          </div>
        </div>
      </div>
      <div className="flex gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" disabled={!isValid} className="flex-1">
          Enviar
        </Button>
      </div>
    </form>
  );
}

// Schedule Booking Form Component
function ScheduleBookingForm({
  request,
  onUpdateData,
  onComplete,
  onCancel,
}: {
  request: Request;
  onUpdateData: (data: Partial<ScheduleBookingData>) => void;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const data = request.data as ScheduleBookingData;
  const [formData, setFormData] = useState({
    contratoRef: data.contratoRef || "",
    enviarPorEmail: data.enviarPorEmail,
    emailDestino: data.emailDestino || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.contratoRef.trim() || formData.enviarPorEmail === null) return;
    if (formData.enviarPorEmail && !formData.emailDestino.trim()) return;
    onUpdateData({ ...data, ...formData });
    onComplete();
  };

  const isValid =
    formData.contratoRef.trim() !== "" &&
    formData.enviarPorEmail !== null &&
    (!formData.enviarPorEmail || formData.emailDestino.trim() !== "");

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm font-medium text-blue-800">Schedule do Booking</p>
        <p className="text-sm text-blue-700 mt-1">Solicite os dados do booking.</p>
      </div>
      <div className="space-y-4">
        <div>
          <Label htmlFor="sb-ref" className="text-sm">
            Contrato *
          </Label>
          <Input
            id="sb-ref"
            value={formData.contratoRef}
            onChange={(e) => setFormData({ ...formData, contratoRef: e.target.value })}
            placeholder="Ex: MB251/25"
            className="mt-1"
          />
        </div>
        <div className="space-y-3">
          <Label className="text-base font-medium">Enviar por e-mail?</Label>
          <div className="flex gap-3">
            <Button
              type="button"
              variant={formData.enviarPorEmail === true ? "default" : "outline"}
              className="flex-1"
              onClick={() => setFormData({ ...formData, enviarPorEmail: true })}
            >
              Sim
            </Button>
            <Button
              type="button"
              variant={formData.enviarPorEmail === false ? "default" : "outline"}
              className="flex-1"
              onClick={() => setFormData({ ...formData, enviarPorEmail: false })}
            >
              Nao
            </Button>
          </div>
          {formData.enviarPorEmail && (
            <Input
              id="sb-email"
              type="email"
              value={formData.emailDestino}
              onChange={(e) => setFormData({ ...formData, emailDestino: e.target.value })}
              placeholder="email@empresa.com"
              className="mt-2"
            />
          )}
        </div>
      </div>
      <div className="flex gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" disabled={!isValid} className="flex-1">
          Solicitar
        </Button>
      </div>
    </form>
  );
}

// Telex Release Form Component
function TelexReleaseForm({
  request,
  onUpdateData,
  onComplete,
  onCancel,
}: {
  request: Request;
  onUpdateData: (data: Partial<TelexReleaseData>) => void;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const data = request.data as TelexReleaseData;
  const [formData, setFormData] = useState({
    contratoRef: data.contratoRef || "",
    metodoRecebimento: data.metodoRecebimento,
    emailDestino: data.emailDestino || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.contratoRef.trim() || !formData.metodoRecebimento) return;
    if (formData.metodoRecebimento === "email" && !formData.emailDestino.trim()) return;
    onUpdateData({ ...data, ...formData });
    onComplete();
  };

  const isValid =
    formData.contratoRef.trim() !== "" &&
    formData.metodoRecebimento !== null &&
    (formData.metodoRecebimento !== "email" || formData.emailDestino.trim() !== "");

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm font-medium text-blue-800">Telex Release</p>
        <p className="text-sm text-blue-700 mt-1">Liberacao apos confirmacao de pagamento.</p>
      </div>
      <div className="space-y-4">
        <div>
          <Label htmlFor="tr-ref" className="text-sm">
            Contrato *
          </Label>
          <Input
            id="tr-ref"
            value={formData.contratoRef}
            onChange={(e) => setFormData({ ...formData, contratoRef: e.target.value })}
            placeholder="Ex: MB251/25"
            className="mt-1"
          />
        </div>
        <div className="space-y-3">
          <Label className="text-base font-medium">Deseja receber:</Label>
          <div className="flex gap-3">
            <Button
              type="button"
              variant={formData.metodoRecebimento === "email" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setFormData({ ...formData, metodoRecebimento: "email" })}
            >
              Por e-mail
            </Button>
            <Button
              type="button"
              variant={formData.metodoRecebimento === "chat" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setFormData({ ...formData, metodoRecebimento: "chat" })}
            >
              No sistema
            </Button>
          </div>
          {formData.metodoRecebimento === "email" && (
            <Input
              id="tr-email"
              type="email"
              value={formData.emailDestino}
              onChange={(e) => setFormData({ ...formData, emailDestino: e.target.value })}
              placeholder="email@empresa.com"
              className="mt-2"
            />
          )}
        </div>
      </div>
      <div className="flex gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" disabled={!isValid} className="flex-1">
          Solicitar
        </Button>
      </div>
    </form>
  );
}

// Summary Components
function ScheduleProformaSummary({ request }: { request: Request }) {
  const data = request.data as ScheduleProformaData;
  return (
    <GenericSummary
      request={request}
      title={data.aprovado ? "Aprovado" : "Ajustes Solicitados"}
      items={[
        { label: "Navio", value: data.navio },
        { label: "Porto Embarque", value: data.portoEmbarque },
        { label: "Porto Destino", value: data.portoDestino },
        { label: "ETA", value: data.eta },
        { label: "Peso/Container", value: data.pesoContainer ? `${data.pesoContainer} kg` : "" },
        { label: "Paletizado", value: data.paletizado ? "Sim" : "Nao" },
        ...(data.observacoes ? [{ label: "Observacoes", value: data.observacoes }] : []),
      ]}
    />
  );
}

function FichasTecnicasSummary({ request }: { request: Request }) {
  const data = request.data as FichasTecnicasData;
  return (
    <GenericSummary
      request={request}
      title="Fichas Solicitadas"
      items={[
        { label: "Proforma", value: data.proformaRef },
        { label: "Etiquetas", value: data.solicitarEtiquetas ? "Solicitadas" : "Nao" },
      ]}
    />
  );
}

function DraftsSummary({ request }: { request: Request }) {
  const data = request.data as DraftsData;
  return (
    <GenericSummary
      request={request}
      title="Drafts Solicitados"
      items={[
        { label: "Contrato", value: data.contratoRef },
        { label: "Envio", value: data.metodoEnvio === "email" ? "Por e-mail" : "Download" },
        ...(data.emailDestino ? [{ label: "E-mail", value: data.emailDestino }] : []),
      ]}
    />
  );
}

function AlteracaoDocumentoSummary({ request }: { request: Request }) {
  const data = request.data as AlteracaoDocumentoData;
  return (
    <GenericSummary
      request={request}
      title="Alteracao Solicitada"
      items={[
        { label: "Contrato", value: data.contratoRef },
        { label: "Documento", value: data.tipoDocumento },
        { label: "Campo", value: data.campoCorrigir },
        { label: "Descricao", value: data.descricaoAlteracao },
      ]}
    />
  );
}

function AlteracaoBLSummary({ request }: { request: Request }) {
  const data = request.data as AlteracaoBLData;
  return (
    <GenericSummary
      request={request}
      title={data.aceitaCusto ? "Solicitacao Enviada" : "Cancelada"}
      items={[
        { label: "Contrato", value: data.contratoRef },
        { label: "Alteracao", value: data.descricaoAlteracao },
        { label: "Aceita custo", value: data.aceitaCusto ? "Sim" : "Nao" },
      ]}
    />
  );
}

function ScheduleBookingSummary({ request }: { request: Request }) {
  const data = request.data as ScheduleBookingData;
  return (
    <GenericSummary
      request={request}
      title="Schedule Solicitado"
      items={[
        { label: "Contrato", value: data.contratoRef },
        { label: "Envio", value: data.enviarPorEmail ? "Por e-mail" : "No sistema" },
        ...(data.emailDestino ? [{ label: "E-mail", value: data.emailDestino }] : []),
      ]}
    />
  );
}

function TelexReleaseSummary({ request }: { request: Request }) {
  const data = request.data as TelexReleaseData;
  return (
    <GenericSummary
      request={request}
      title="Telex Release Solicitado"
      items={[
        { label: "Contrato", value: data.contratoRef },
        {
          label: "Recebimento",
          value: data.metodoRecebimento === "email" ? "Por e-mail" : "No sistema",
        },
        ...(data.emailDestino ? [{ label: "E-mail", value: data.emailDestino }] : []),
      ]}
    />
  );
}

// Generic Summary Component
function GenericSummary({
  request,
  title,
  items,
}: {
  request: Request;
  title: string;
  items: { label: string; value: string }[];
}) {
  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-green-600 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <div>
            <p className="text-sm font-medium text-green-800">{title}</p>
            <p className="text-sm text-green-700 mt-1">Requisicao processada com sucesso.</p>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {items
          .filter((item) => item.value)
          .map((item) => (
            <div
              key={item.label}
              className="flex justify-between items-center p-3 rounded-lg bg-muted/50"
            >
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <span className="text-sm font-medium text-foreground">{item.value}</span>
            </div>
          ))}
      </div>
      <div className="pt-4 border-t">
        <p className="text-xs text-muted-foreground text-center">
          Concluida em{" "}
          {new Date(request.updatedAt).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
