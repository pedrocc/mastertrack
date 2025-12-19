import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShipTrackingMap } from "../components/ship-tracking-map";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Progress } from "../components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../components/ui/sheet";
import { useAuth } from "../contexts/auth-context";
import { type Container, useCompanyContainers } from "../hooks/use-containers";

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading, user, isAdmin } = useAuth();
  const {
    data: userContainers = [],
    isLoading: containersLoading,
    isFetched: containersLoaded,
  } = useCompanyContainers(user?.companyId);
  const navigate = useNavigate();
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const [dateFilter, setDateFilter] = useState({ start: "", end: "" });
  const [searchTerm, setSearchTerm] = useState("");

  // Redirect to login if not authenticated (after auth loading completes)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // EXPLICIT EARLY RETURNS - simple sequential checks

  // 1. If auth is loading, show skeleton
  if (authLoading) {
    return <DashboardSkeleton />;
  }

  // 2. If not authenticated, return null (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // 3. At this point we have a user. Check if admin.
  if (isAdmin) {
    // Admin is ready - show admin dashboard
    return <AdminDashboard user={user} />;
  }

  // 4. Customer flow - need to wait for containers if they have a company
  const hasCompanyId = !!user?.companyId;
  const containersAreReady = containersLoaded && !containersLoading;

  // If customer has a company, wait for containers to load
  if (hasCompanyId && !containersAreReady) {
    return <DashboardSkeleton />;
  }

  // 5. Customer without company OR containers are ready - show dashboard

  // Filter containers
  const filteredContainers = userContainers.filter((container) => {
    const matchesSearch =
      container.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      container.cargo.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesDate = true;
    if (dateFilter.start) {
      matchesDate = new Date(container.departureDate) >= new Date(dateFilter.start);
    }
    if (dateFilter.end && matchesDate) {
      matchesDate = new Date(container.arrivalForecast) <= new Date(dateFilter.end);
    }

    return matchesSearch && matchesDate;
  });

  // Calculate stats
  const stats = {
    pagamentosOk: filteredContainers.filter((c) => c.paymentStatus === "ok").length,
    pagamentosPendentes: filteredContainers.filter((c) => c.paymentStatus === "pendente").length,
    aEmbarcar: filteredContainers.filter((c) => c.status === "a_embarcar").length,
    embarcados: filteredContainers.filter(
      (c) => c.status === "embarcado" || c.status === "em_transito"
    ).length,
    entregues: filteredContainers.filter((c) => c.status === "entregue").length,
    aEntregar: filteredContainers.filter((c) => c.status !== "entregue").length,
  };

  const getStatusLabel = (status: Container["status"]) => {
    const labels = {
      a_embarcar: "A Embarcar",
      embarcado: "Embarcado",
      em_transito: "Em Transito",
      entregue: "Entregue",
    };
    return labels[status];
  };

  const getStatusColor = (status: Container["status"]) => {
    const colors = {
      a_embarcar: "bg-amber-100 text-amber-800 border-amber-200",
      embarcado: "bg-blue-100 text-blue-800 border-blue-200",
      em_transito: "bg-indigo-100 text-indigo-800 border-indigo-200",
      entregue: "bg-green-100 text-green-800 border-green-200",
    };
    return colors[status];
  };

  // If admin, show admin dashboard
  if (isAdmin) {
    return <AdminDashboard user={user} />;
  }

  // Customer dashboard
  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-1 w-8 bg-primary rounded-full" />
          <span className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
            Painel do Cliente
          </span>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Ola, {user?.name?.split(" ")[0]}!
        </h1>
        <p className="text-muted-foreground">
          Acompanhe seus containers e o status das suas entregas.
        </p>
        {user?.companyName && (
          <div className="flex items-center gap-2 mt-3">
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
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span className="text-sm font-medium text-primary">{user.companyName}</span>
          </div>
        )}
      </div>

      {/* Date Filter */}
      <Card className="mb-6 border-dashed">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-muted-foreground"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 6h18" />
                <path d="M7 12h10" />
                <path d="M10 18h4" />
              </svg>
              <span className="text-sm font-medium text-muted-foreground">Filtrar por data:</span>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="date-start" className="text-sm text-muted-foreground">
                De:
              </label>
              <Input
                id="date-start"
                type="date"
                className="w-40 h-9"
                value={dateFilter.start}
                onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="date-end" className="text-sm text-muted-foreground">
                Ate:
              </label>
              <Input
                id="date-end"
                type="date"
                className="w-40 h-9"
                value={dateFilter.end}
                onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
              />
            </div>
            {(dateFilter.start || dateFilter.end) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDateFilter({ start: "", end: "" })}
                className="text-muted-foreground"
              >
                Limpar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {/* Payment Status */}
        <Card className="overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-green-500 to-amber-500" />
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider">
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
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <line x1="2" x2="22" y1="10" y2="10" />
              </svg>
              Status de Pagamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="text-sm text-muted-foreground">Pagamentos OK</span>
                </div>
                <p className="text-3xl font-bold text-foreground">{stats.pagamentosOk}</p>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                  <span className="text-sm text-muted-foreground">Pendentes</span>
                </div>
                <p className="text-3xl font-bold text-foreground">{stats.pagamentosPendentes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Status */}
        <Card className="overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider">
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
                <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
                <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9" />
                <path d="M12 3v6" />
              </svg>
              Status de Envio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                  <span className="text-sm text-muted-foreground">A Embarcar</span>
                </div>
                <p className="text-3xl font-bold text-foreground">{stats.aEmbarcar}</p>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span className="text-sm text-muted-foreground">Embarcados</span>
                </div>
                <p className="text-3xl font-bold text-foreground">{stats.embarcados}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Status */}
        <Card className="overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary to-green-500" />
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider">
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
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              Status de Entrega
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="text-sm text-muted-foreground">Entregues</span>
                </div>
                <p className="text-3xl font-bold text-foreground">{stats.entregues}</p>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  <span className="text-sm text-muted-foreground">A Entregar</span>
                </div>
                <p className="text-3xl font-bold text-foreground">{stats.aEntregar}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Container List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
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
                  <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
                  <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9" />
                  <path d="M12 3v6" />
                </svg>
                Meus Containers
              </CardTitle>
              <CardDescription>
                {filteredContainers.length} container{filteredContainers.length !== 1 ? "s" : ""}{" "}
                encontrado{filteredContainers.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
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
                <path d="m21 21-4.35-4.35" />
              </svg>
              <Input
                type="search"
                placeholder="Buscar container..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredContainers.length === 0 ? (
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
                  <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
                  <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9" />
                  <path d="M12 3v6" />
                </svg>
                <p className="text-muted-foreground">Nenhum container encontrado.</p>
              </div>
            ) : (
              filteredContainers.map((container) => (
                <button
                  key={container.id}
                  type="button"
                  className="w-full text-left p-4 rounded-xl border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 bg-white group"
                  onClick={() => setSelectedContainer(container)}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Container Number & Type */}
                    <div className="flex items-center gap-3 lg:w-56">
                      <div
                        className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                          container.isFrozen
                            ? "bg-cyan-100 text-cyan-700"
                            : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {container.isFrozen ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M2 12h20" />
                            <path d="M12 2v20" />
                            <path d="m4.93 4.93 14.14 14.14" />
                            <path d="m19.07 4.93-14.14 14.14" />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
                            <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9" />
                            <path d="M12 3v6" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="font-mono font-bold text-foreground group-hover:text-primary transition-colors">
                          {container.number}
                        </p>
                        <div className="flex flex-col">
                          {container.isFrozen && (
                            <span className="text-xs text-cyan-600 font-medium flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                              Refrigerado
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">{container.cargo}</span>
                        </div>
                      </div>
                    </div>

                    {/* Route */}
                    <div className="flex-1 hidden md:block">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground truncate max-w-32">
                          {container.origin}
                        </span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-primary flex-shrink-0"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M5 12h14" />
                          <path d="m12 5 7 7-7 7" />
                        </svg>
                        <span className="font-medium text-foreground truncate max-w-32">
                          {container.destination}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Progress value={container.progress} className="flex-1 h-1.5" />
                        <span className="text-xs text-muted-foreground w-10">
                          {container.progress}%
                        </span>
                      </div>
                    </div>

                    {/* Status & Payment */}
                    <div className="flex items-center gap-2 lg:w-48 justify-end">
                      <Badge className={`${getStatusColor(container.status)} border`}>
                        {getStatusLabel(container.status)}
                      </Badge>
                      {container.paymentStatus === "pendente" && (
                        <Badge variant="outline" className="border-amber-300 text-amber-700">
                          Pag. Pendente
                        </Badge>
                      )}
                    </div>

                    {/* Arrow */}
                    <div className="hidden lg:block">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Container Detail Sheet */}
      <Sheet
        open={!!selectedContainer}
        onOpenChange={(open) => !open && setSelectedContainer(null)}
      >
        <SheetContent className="overflow-y-auto">
          {selectedContainer && (
            <>
              <SheetHeader className="pb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      selectedContainer.isFrozen
                        ? "bg-cyan-100 text-cyan-700"
                        : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {selectedContainer.isFrozen ? (
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
                        <path d="M2 12h20" />
                        <path d="M12 2v20" />
                        <path d="m4.93 4.93 14.14 14.14" />
                        <path d="m19.07 4.93-14.14 14.14" />
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
                        <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
                        <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9" />
                        <path d="M12 3v6" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <SheetTitle className="font-mono">{selectedContainer.number}</SheetTitle>
                    <SheetDescription>{selectedContainer.cargo}</SheetDescription>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className={`${getStatusColor(selectedContainer.status)} border`}>
                    {getStatusLabel(selectedContainer.status)}
                  </Badge>
                  {selectedContainer.isFrozen && (
                    <Badge variant="outline" className="border-cyan-300 text-cyan-700">
                      Refrigerado
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className={
                      selectedContainer.paymentStatus === "ok"
                        ? "border-green-300 text-green-700"
                        : "border-amber-300 text-amber-700"
                    }
                  >
                    {selectedContainer.paymentStatus === "ok" ? "Pagamento OK" : "Pag. Pendente"}
                  </Badge>
                </div>
              </SheetHeader>

              {/* Ship Tracking Map */}
              <div className="mb-6">
                <ShipTrackingMap
                  route={selectedContainer.route}
                  containerNumber={selectedContainer.number}
                  progress={selectedContainer.progress}
                />
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Origem</p>
                  <p className="text-sm font-medium">{selectedContainer.origin}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Destino</p>
                  <p className="text-sm font-medium">{selectedContainer.destination}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Partida</p>
                  <p className="text-sm font-medium">
                    {new Date(selectedContainer.departureDate).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Previsao de Chegada</p>
                  <p className="text-sm font-medium text-primary">
                    {new Date(selectedContainer.arrivalForecast).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Peso</p>
                  <p className="text-sm font-medium">{selectedContainer.weight}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Progresso</p>
                  <p className="text-sm font-medium">{selectedContainer.progress}%</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Progresso da Viagem</span>
                  <span className="text-sm text-primary font-bold">
                    {selectedContainer.progress}%
                  </span>
                </div>
                <Progress value={selectedContainer.progress} className="h-2" />
              </div>

              {/* Route Timeline */}
              <div>
                <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
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
                    <circle cx="12" cy="12" r="10" />
                    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                  </svg>
                  Rota do Container
                </h4>
                <div className="relative">
                  {selectedContainer.route.map((point, index) => (
                    <div key={point.location} className="flex gap-4 pb-6 last:pb-0">
                      {/* Timeline line */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                            point.status === "completed"
                              ? "border-green-500 bg-green-500"
                              : point.status === "current"
                                ? "border-primary bg-primary animate-pulse"
                                : "border-muted-foreground/30 bg-white"
                          }`}
                        >
                          {point.status === "completed" && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-2.5 w-2.5 text-white"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                        {index !== selectedContainer.route.length - 1 && (
                          <div
                            className={`w-0.5 flex-1 mt-1 ${
                              point.status === "completed" ? "bg-green-500" : "bg-muted"
                            }`}
                          />
                        )}
                      </div>
                      {/* Content */}
                      <div className="flex-1 pb-2">
                        <p
                          className={`font-medium ${
                            point.status === "current"
                              ? "text-primary"
                              : point.status === "completed"
                                ? "text-foreground"
                                : "text-muted-foreground"
                          }`}
                        >
                          {point.location}
                        </p>
                        <p className="text-xs text-muted-foreground">{point.date}</p>
                        {point.status === "current" && (
                          <Badge className="mt-2 bg-primary/10 text-primary border-0 text-xs">
                            Localizacao Atual
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Loading Skeleton Component
function DashboardSkeleton() {
  return (
    <div className="animate-fade-in-up">
      {/* Header Skeleton */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-1 w-8 bg-muted rounded-full" />
          <div className="h-3 w-24 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-9 w-48 bg-muted rounded animate-pulse mb-2" />
        <div className="h-5 w-72 bg-muted rounded animate-pulse" />
        <div className="flex items-center gap-2 mt-3">
          <div className="h-4 w-4 bg-muted rounded animate-pulse" />
          <div className="h-4 w-40 bg-muted rounded animate-pulse" />
        </div>
      </div>

      {/* Filter Skeleton */}
      <Card className="mb-6 border-dashed">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-5 w-28 bg-muted rounded animate-pulse" />
            <div className="h-9 w-40 bg-muted rounded animate-pulse" />
            <div className="h-9 w-40 bg-muted rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden">
            <div className="h-1 bg-muted" />
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                <div className="h-3 w-32 bg-muted rounded animate-pulse" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="h-3 w-20 bg-muted rounded animate-pulse mb-2" />
                  <div className="h-8 w-12 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-12 w-px bg-border" />
                <div className="flex-1">
                  <div className="h-3 w-20 bg-muted rounded animate-pulse mb-2" />
                  <div className="h-8 w-12 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Container List Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="h-6 w-40 bg-muted rounded animate-pulse mb-2" />
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-10 w-64 bg-muted rounded animate-pulse" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 rounded-xl border border-border bg-white">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex items-center gap-3 lg:w-56">
                    <div className="h-12 w-12 rounded-lg bg-muted animate-pulse" />
                    <div>
                      <div className="h-5 w-28 bg-muted rounded animate-pulse mb-1" />
                      <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="flex-1 hidden md:block">
                    <div className="h-4 w-48 bg-muted rounded animate-pulse mb-2" />
                    <div className="h-1.5 w-full bg-muted rounded animate-pulse" />
                  </div>
                  <div className="flex items-center gap-2 lg:w-48 justify-end">
                    <div className="h-6 w-24 bg-muted rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Admin Dashboard Component (separate for admins)
function AdminDashboard({
  user,
}: {
  user: { name?: string; email?: string; role?: string } | null;
}) {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in-up">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Ola, {user?.name?.split(" ")[0]}!
        </h1>
        <p className="text-muted-foreground">
          Bem-vindo ao Mastertrack. Aqui esta o resumo do seu sistema.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="border-l-4 border-l-primary hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">
              Status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">Ativo</p>
                <p className="text-xs text-muted-foreground">Sistema operacional</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">
              Seu Perfil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground capitalize">{user?.role}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
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
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">
              Ultimo Acesso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">Agora</p>
                <p className="text-xs text-muted-foreground">
                  {new Date().toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
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

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">
              Privilegios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">Admin</p>
                <p className="text-xs text-muted-foreground">Acesso total</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-amber-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Welcome Card - Takes 2 columns */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              Comece por aqui
            </CardTitle>
            <CardDescription>
              Como administrador, voce pode gerenciar usuarios e configuracoes do sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                className="p-4 rounded-lg border border-border text-left w-full bg-white hover:border-primary/30 hover:shadow-md cursor-pointer transition-all"
                onClick={() => navigate({ to: "/admin/users" })}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
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
                      <line x1="19" y1="8" x2="19" y2="14" />
                      <line x1="22" y1="11" x2="16" y2="11" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">Gerenciar Usuarios</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Adicione, edite ou remova usuarios do sistema
                    </p>
                  </div>
                </div>
              </button>
              <button
                type="button"
                className="p-4 rounded-lg border border-border text-left w-full bg-muted/30 cursor-not-allowed opacity-60 transition-all"
                disabled
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted">
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
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">Configuracoes</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Ajuste as preferencias do sistema
                    </p>
                    <span className="inline-block mt-2 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      Em breve
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Activity Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Atividade Recente</CardTitle>
            <CardDescription>Suas ultimas acoes no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-muted text-muted-foreground">
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
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">Login realizado</p>
                  <p className="text-xs text-muted-foreground">Agora mesmo</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-muted text-muted-foreground">
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
                    <path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">Sessao iniciada</p>
                  <p className="text-xs text-muted-foreground">Agora mesmo</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
