import type { Company } from "@mastertrack/shared";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../../components/ui/sheet";
import { useAuth } from "../../contexts/auth-context";
import { useCompanies } from "../../contexts/companies-context";

export const Route = createFileRoute("/admin/companies")({
  component: AdminCompaniesPage,
});

function AdminCompaniesPage() {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { companies, addCompany, deleteCompany, getCompanyContainers } = useCompanies();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [newCompany, setNewCompany] = useState({
    name: "",
    cnpj: "",
    email: "",
    phone: "",
    address: "",
  });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate({ to: "/login" });
      } else if (!isAdmin) {
        navigate({ to: "/" });
      }
    }
  }, [isLoading, isAuthenticated, isAdmin, navigate]);

  if (isLoading || !isAuthenticated || !isAdmin) {
    return null;
  }

  const filteredCompanies = companies.filter(
    (company) =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.cnpj.includes(searchTerm) ||
      company.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCompany = (e: React.FormEvent) => {
    e.preventDefault();
    addCompany(newCompany);
    setNewCompany({ name: "", cnpj: "", email: "", phone: "", address: "" });
    setShowAddForm(false);
  };

  const handleDeleteCompany = (companyId: string) => {
    if (window.confirm("Tem certeza que deseja remover esta empresa?")) {
      deleteCompany(companyId);
    }
  };

  const formatCnpj = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .slice(0, 18);
  };

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Gestao de Empresas</h1>
          <p className="text-muted-foreground">
            Cadastre e gerencie as empresas clientes. Associe usuarios e cargas.
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
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
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Nova Empresa
        </Button>
      </div>

      {/* Add Company Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in-up">
          <Card className="w-full max-w-lg mx-4 animate-scale-in">
            <CardHeader>
              <CardTitle>Cadastrar Empresa</CardTitle>
              <CardDescription>Preencha os dados da nova empresa cliente</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddCompany} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Nome da Empresa</Label>
                  <Input
                    id="company-name"
                    value={newCompany.name}
                    onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                    placeholder="Razao Social"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-cnpj">CNPJ</Label>
                  <Input
                    id="company-cnpj"
                    value={newCompany.cnpj}
                    onChange={(e) =>
                      setNewCompany({ ...newCompany, cnpj: formatCnpj(e.target.value) })
                    }
                    placeholder="00.000.000/0000-00"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-email">Email</Label>
                    <Input
                      id="company-email"
                      type="email"
                      value={newCompany.email}
                      onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })}
                      placeholder="contato@empresa.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-phone">Telefone</Label>
                    <Input
                      id="company-phone"
                      value={newCompany.phone}
                      onChange={(e) => setNewCompany({ ...newCompany, phone: e.target.value })}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-address">Endereco</Label>
                  <Input
                    id="company-address"
                    value={newCompany.address}
                    onChange={(e) => setNewCompany({ ...newCompany, address: e.target.value })}
                    placeholder="Endereco completo"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1">
                    Cadastrar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Empresas</p>
                <p className="text-3xl font-bold text-foreground">{companies.length}</p>
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
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Cargas</p>
                <p className="text-3xl font-bold text-foreground">
                  {companies.reduce((acc, c) => acc + getCompanyContainers(c.id).length, 0)}
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
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Empresas Ativas</p>
                <p className="text-3xl font-bold text-foreground">{companies.length}</p>
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

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
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
            placeholder="Buscar empresas..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Companies List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lista de Empresas</CardTitle>
          <CardDescription>
            {filteredCompanies.length} empresa{filteredCompanies.length !== 1 ? "s" : ""} cadastrada
            {filteredCompanies.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredCompanies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma empresa encontrada.
              </div>
            ) : (
              filteredCompanies.map((company) => (
                <button
                  type="button"
                  key={company.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer w-full text-left"
                  onClick={() => setSelectedCompany(company)}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
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
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{company.name}</p>
                      <p className="text-sm text-muted-foreground">{company.cnpj}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary">
                      {getCompanyContainers(company.id).length} cargas
                    </Badge>
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {company.email}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-red-600 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCompany(company.id);
                      }}
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
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </Button>
                  </div>
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Company Detail Sheet */}
      <Sheet open={!!selectedCompany} onOpenChange={(open) => !open && setSelectedCompany(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-xl">
          {selectedCompany && <CompanyDetailSheet company={selectedCompany} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Company Detail Sheet Component
function CompanyDetailSheet({ company }: { company: Company }) {
  const { getCompanyContainers, addContainerToCompany, removeContainerFromCompany } =
    useCompanies();
  const containers = getCompanyContainers(company.id);
  const [showAddContainer, setShowAddContainer] = useState(false);
  const [newContainer, setNewContainer] = useState({
    number: "",
    isFrozen: false,
    origin: "",
    destination: "",
    departureDate: "",
    arrivalForecast: "",
    cargo: "",
    weight: "",
  });

  const handleAddContainer = (e: React.FormEvent) => {
    e.preventDefault();
    addContainerToCompany(company.id, {
      number: newContainer.number,
      isFrozen: newContainer.isFrozen,
      origin: newContainer.origin,
      destination: newContainer.destination,
      departureDate: newContainer.departureDate,
      arrivalForecast: newContainer.arrivalForecast,
      cargo: newContainer.cargo,
      weight: newContainer.weight,
    });
    setNewContainer({
      number: "",
      isFrozen: false,
      origin: "",
      destination: "",
      departureDate: "",
      arrivalForecast: "",
      cargo: "",
      weight: "",
    });
    setShowAddContainer(false);
  };

  return (
    <>
      <SheetHeader className="pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
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
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div>
            <SheetTitle className="text-xl">{company.name}</SheetTitle>
            <SheetDescription className="font-mono">{company.cnpj}</SheetDescription>
          </div>
        </div>
      </SheetHeader>

      {/* Company Info */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground mb-1">Email</p>
          <p className="text-sm font-medium">{company.email}</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground mb-1">Telefone</p>
          <p className="text-sm font-medium">{company.phone || "-"}</p>
        </div>
        <div className="col-span-2 p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground mb-1">Endereco</p>
          <p className="text-sm font-medium">{company.address || "-"}</p>
        </div>
      </div>

      {/* Containers Section */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Cargas Cadastradas</h3>
          <Button size="sm" onClick={() => setShowAddContainer(true)}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
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
            Adicionar Carga
          </Button>
        </div>

        {/* Add Container Form */}
        {showAddContainer && (
          <Card className="mb-4">
            <CardContent className="pt-4">
              <form onSubmit={handleAddContainer} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="container-number" className="text-xs">
                      Numero do Container
                    </Label>
                    <Input
                      id="container-number"
                      value={newContainer.number}
                      onChange={(e) =>
                        setNewContainer({ ...newContainer, number: e.target.value.toUpperCase() })
                      }
                      placeholder="MSCU1234567"
                      required
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="container-cargo" className="text-xs">
                      Tipo de Carga
                    </Label>
                    <Input
                      id="container-cargo"
                      value={newContainer.cargo}
                      onChange={(e) => setNewContainer({ ...newContainer, cargo: e.target.value })}
                      placeholder="Descricao da carga"
                      required
                      className="h-9"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="container-origin" className="text-xs">
                      Origem
                    </Label>
                    <Input
                      id="container-origin"
                      value={newContainer.origin}
                      onChange={(e) => setNewContainer({ ...newContainer, origin: e.target.value })}
                      placeholder="Porto de origem"
                      required
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="container-destination" className="text-xs">
                      Destino
                    </Label>
                    <Input
                      id="container-destination"
                      value={newContainer.destination}
                      onChange={(e) =>
                        setNewContainer({ ...newContainer, destination: e.target.value })
                      }
                      placeholder="Porto de destino"
                      required
                      className="h-9"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="container-departure" className="text-xs">
                      Data Saida
                    </Label>
                    <Input
                      id="container-departure"
                      type="date"
                      value={newContainer.departureDate}
                      onChange={(e) =>
                        setNewContainer({ ...newContainer, departureDate: e.target.value })
                      }
                      required
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="container-arrival" className="text-xs">
                      Previsao Chegada
                    </Label>
                    <Input
                      id="container-arrival"
                      type="date"
                      value={newContainer.arrivalForecast}
                      onChange={(e) =>
                        setNewContainer({ ...newContainer, arrivalForecast: e.target.value })
                      }
                      required
                      className="h-9"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="container-weight" className="text-xs">
                      Peso
                    </Label>
                    <Input
                      id="container-weight"
                      value={newContainer.weight}
                      onChange={(e) => setNewContainer({ ...newContainer, weight: e.target.value })}
                      placeholder="Ex: 22.5 ton"
                      className="h-9"
                    />
                  </div>
                  <div className="flex items-end gap-2 pb-1">
                    <input
                      id="container-frozen"
                      type="checkbox"
                      checked={newContainer.isFrozen}
                      onChange={(e) =>
                        setNewContainer({ ...newContainer, isFrozen: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="container-frozen" className="text-xs cursor-pointer">
                      Container Refrigerado
                    </Label>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddContainer(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" size="sm" className="flex-1">
                    Adicionar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Containers List */}
        <div className="space-y-2">
          {containers.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              Nenhuma carga cadastrada para esta empresa.
            </div>
          ) : (
            containers.map((container) => (
              <div
                key={container.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-8 w-8 rounded-md flex items-center justify-center ${
                      container.isFrozen
                        ? "bg-cyan-100 text-cyan-600"
                        : "bg-amber-100 text-amber-600"
                    }`}
                  >
                    {container.isFrozen ? (
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
                        <line x1="12" y1="2" x2="12" y2="22" />
                        <path d="M20 12l-4-4v8l4-4" />
                        <path d="M4 12l4-4v8L4 12" />
                        <path d="M12 2l4 4H8l4-4" />
                        <path d="M12 22l4-4H8l4 4" />
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
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-mono font-medium">{container.number}</p>
                    <p className="text-xs text-muted-foreground">
                      {container.origin} → {container.destination}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      container.status === "entregue"
                        ? "border-green-300 text-green-700"
                        : container.status === "em_transito"
                          ? "border-blue-300 text-blue-700"
                          : "border-gray-300 text-gray-700"
                    }
                  >
                    {container.status === "entregue"
                      ? "Entregue"
                      : container.status === "em_transito"
                        ? "Em Transito"
                        : container.status === "embarcado"
                          ? "Embarcado"
                          : "A Embarcar"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                    onClick={() => removeContainerFromCompany(company.id, container.id)}
                  >
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
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    </svg>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
