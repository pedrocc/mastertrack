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
import {
  useCompaniesQuery,
  useCreateCompany,
  useDeleteCompany,
  useUpdateCompany,
} from "../../hooks/useCompanies";

export const Route = createFileRoute("/admin/companies")({
  component: AdminCompaniesPage,
});

interface CompanyFormData {
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  address: string;
}

function AdminCompaniesPage() {
  const { isAuthenticated, isLoading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();

  // API hooks
  const {
    data: companiesResponse,
    isLoading: companiesLoading,
    error: companiesError,
  } = useCompaniesQuery();
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();
  const deleteCompany = useDeleteCompany();

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [newCompany, setNewCompany] = useState<CompanyFormData>({
    name: "",
    cnpj: "",
    email: "",
    phone: "",
    address: "",
  });
  const [editForm, setEditForm] = useState<CompanyFormData>({
    name: "",
    cnpj: "",
    email: "",
    phone: "",
    address: "",
  });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate({ to: "/login" });
      } else if (!isAdmin) {
        navigate({ to: "/" });
      }
    }
  }, [authLoading, isAuthenticated, isAdmin, navigate]);

  if (authLoading || !isAuthenticated || !isAdmin) {
    return null;
  }

  const companies = companiesResponse?.data ?? [];
  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

  const filteredCompanies = companies.filter(
    (company) =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.cnpj.includes(searchTerm) ||
      company.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCompany.mutateAsync(newCompany);
      setNewCompany({ name: "", cnpj: "", email: "", phone: "", address: "" });
      setShowAddForm(false);
    } catch (error) {
      console.error("Erro ao criar empresa:", error);
      alert(error instanceof Error ? error.message : "Erro ao criar empresa");
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    if (window.confirm("Tem certeza que deseja remover esta empresa?")) {
      try {
        await deleteCompany.mutateAsync(companyId);
        if (selectedCompanyId === companyId) {
          setSelectedCompanyId(null);
        }
      } catch (error) {
        console.error("Erro ao remover empresa:", error);
        alert(error instanceof Error ? error.message : "Erro ao remover empresa");
      }
    }
  };

  const handleStartEdit = (company: (typeof companies)[0]) => {
    setEditingCompanyId(company.id);
    setEditForm({
      name: company.name,
      cnpj: company.cnpj,
      email: company.email,
      phone: company.phone ?? "",
      address: company.address ?? "",
    });
  };

  const handleEditCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompanyId) return;

    try {
      await updateCompany.mutateAsync({
        id: editingCompanyId,
        data: editForm,
      });
      setEditingCompanyId(null);
      setEditForm({ name: "", cnpj: "", email: "", phone: "", address: "" });
    } catch (error) {
      console.error("Erro ao atualizar empresa:", error);
      alert(error instanceof Error ? error.message : "Erro ao atualizar empresa");
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

  if (companiesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Carregando empresas...</div>
      </div>
    );
  }

  if (companiesError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Erro ao carregar empresas: {companiesError.message}</div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Gestao de Empresas</h1>
          <p className="text-muted-foreground">Cadastre e gerencie as empresas clientes.</p>
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
                    disabled={createCompany.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={createCompany.isPending}>
                    {createCompany.isPending ? "Salvando..." : "Cadastrar"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Company Form Modal */}
      {editingCompanyId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in-up">
          <Card className="w-full max-w-lg mx-4 animate-scale-in">
            <CardHeader>
              <CardTitle>Editar Empresa</CardTitle>
              <CardDescription>Altere os dados da empresa</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEditCompany} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-company-name">Nome da Empresa</Label>
                  <Input
                    id="edit-company-name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="Razao Social"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-company-cnpj">CNPJ</Label>
                  <Input
                    id="edit-company-cnpj"
                    value={editForm.cnpj}
                    onChange={(e) => setEditForm({ ...editForm, cnpj: formatCnpj(e.target.value) })}
                    placeholder="00.000.000/0000-00"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-company-email">Email</Label>
                    <Input
                      id="edit-company-email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      placeholder="contato@empresa.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-company-phone">Telefone</Label>
                    <Input
                      id="edit-company-phone"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-company-address">Endereco</Label>
                  <Input
                    id="edit-company-address"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    placeholder="Endereco completo"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingCompanyId(null)}
                    className="flex-1"
                    disabled={updateCompany.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={updateCompany.isPending}>
                    {updateCompany.isPending ? "Salvando..." : "Salvar"}
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

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cadastradas Hoje</p>
                <p className="text-3xl font-bold text-foreground">
                  {
                    companies.filter((c) => {
                      const today = new Date().toISOString().split("T")[0];
                      return c.createdAt.split("T")[0] === today;
                    }).length
                  }
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
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
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
                  onClick={() => setSelectedCompanyId(company.id)}
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
                    <Badge variant="secondary">Ativa</Badge>
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {company.email}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(company);
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
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-red-600 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCompany(company.id);
                      }}
                      disabled={deleteCompany.isPending}
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
      <Sheet open={!!selectedCompany} onOpenChange={(open) => !open && setSelectedCompanyId(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-xl">
          {selectedCompany && (
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
                    <SheetTitle className="text-xl">{selectedCompany.name}</SheetTitle>
                    <SheetDescription className="font-mono">
                      {selectedCompany.cnpj}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              {/* Company Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <p className="text-sm font-medium">{selectedCompany.email}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Telefone</p>
                  <p className="text-sm font-medium">{selectedCompany.phone || "-"}</p>
                </div>
                <div className="col-span-2 p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Endereco</p>
                  <p className="text-sm font-medium">{selectedCompany.address || "-"}</p>
                </div>
                <div className="col-span-2 p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Cadastrada em</p>
                  <p className="text-sm font-medium">
                    {new Date(selectedCompany.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    handleStartEdit(selectedCompany);
                    setSelectedCompanyId(null);
                  }}
                >
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    handleDeleteCompany(selectedCompany.id);
                  }}
                  disabled={deleteCompany.isPending}
                >
                  Remover
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
