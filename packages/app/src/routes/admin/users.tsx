import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
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
import { useAuth } from "../../contexts/auth-context";
import { useCompanies } from "../../contexts/companies-context";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersPage,
});

// Mock users data (in production would come from API)
interface MockUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  companyId?: string;
  createdAt: string;
}

const INITIAL_USERS: MockUser[] = [
  {
    id: "1",
    name: "Administrador",
    email: "admin@mastertrack.com",
    role: "admin",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "Joao Silva",
    email: "user@mastertrack.com",
    role: "user",
    companyId: "company-1",
    createdAt: "2024-02-20",
  },
  {
    id: "3",
    name: "Maria Santos",
    email: "maria@globaltrading.com.br",
    role: "user",
    companyId: "company-2",
    createdAt: "2024-03-10",
  },
  {
    id: "4",
    name: "Carlos Ferreira",
    email: "carlos@exportamais.com.br",
    role: "user",
    companyId: "company-3",
    createdAt: "2024-04-05",
  },
];

function AdminUsersPage() {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const { companies, getCompanyById } = useCompanies();
  const navigate = useNavigate();
  const [users, setUsers] = useState<MockUser[]>(INITIAL_USERS);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<MockUser | null>(null);
  const [newUser, setNewUser] = useState<{
    name: string;
    email: string;
    role: "admin" | "user";
    companyId: string;
  }>({
    name: "",
    email: "",
    role: "user",
    companyId: "",
  });
  const [editForm, setEditForm] = useState<{
    name: string;
    email: string;
    role: "admin" | "user";
    companyId: string;
  }>({
    name: "",
    email: "",
    role: "user",
    companyId: "",
  });
  const [searchTerm, setSearchTerm] = useState("");

  // Redirect if not authenticated or not admin
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

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const baseUser = {
      id: String(Date.now()),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      createdAt: new Date().toISOString().split("T")[0] ?? "",
    };
    const user: MockUser = newUser.companyId
      ? { ...baseUser, companyId: newUser.companyId }
      : baseUser;
    setUsers([...users, user]);
    setNewUser({ name: "", email: "", role: "user", companyId: "" });
    setShowAddForm(false);
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm("Tem certeza que deseja remover este usuario?")) {
      setUsers(users.filter((u) => u.id !== userId));
    }
  };

  const handleStartEdit = (user: MockUser) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId ?? "",
    });
  };

  const handleEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setUsers(
      users.map((u) => {
        if (u.id !== editingUser.id) return u;
        const baseUser = {
          ...u,
          name: editForm.name,
          email: editForm.email,
          role: editForm.role,
        };
        return editForm.companyId ? { ...baseUser, companyId: editForm.companyId } : baseUser;
      })
    );
    setEditingUser(null);
    setEditForm({ name: "", email: "", role: "user", companyId: "" });
  };

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Gestao de Usuarios</h1>
          <p className="text-muted-foreground">
            Gerencie os usuarios do sistema. Adicione, edite ou remova usuarios.
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
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
          Novo Usuario
        </Button>
      </div>

      {/* Add User Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in-up">
          <Card className="w-full max-w-md mx-4 animate-scale-in">
            <CardHeader>
              <CardTitle>Adicionar Usuario</CardTitle>
              <CardDescription>Preencha os dados do novo usuario</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-user-name">Nome</Label>
                  <Input
                    id="new-user-name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="Nome completo"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-user-email">Email</Label>
                  <Input
                    id="new-user-email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="email@exemplo.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-user-role">Tipo de Usuario</Label>
                  <select
                    id="new-user-role"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={newUser.role}
                    onChange={(e) =>
                      setNewUser({ ...newUser, role: e.target.value as "admin" | "user" })
                    }
                  >
                    <option value="user">Usuario</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                {newUser.role === "user" && (
                  <div className="space-y-2">
                    <Label htmlFor="new-user-company">Empresa</Label>
                    <select
                      id="new-user-company"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={newUser.companyId}
                      onChange={(e) => setNewUser({ ...newUser, companyId: e.target.value })}
                      required
                    >
                      <option value="">Selecione uma empresa</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
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
                    Adicionar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit User Form Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in-up">
          <Card className="w-full max-w-md mx-4 animate-scale-in">
            <CardHeader>
              <CardTitle>Editar Usuario</CardTitle>
              <CardDescription>Altere os dados do usuario</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEditUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-user-name">Nome</Label>
                  <Input
                    id="edit-user-name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="Nome completo"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-user-email">Email</Label>
                  <Input
                    id="edit-user-email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="email@exemplo.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-user-role">Tipo de Usuario</Label>
                  <select
                    id="edit-user-role"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={editForm.role}
                    onChange={(e) =>
                      setEditForm({ ...editForm, role: e.target.value as "admin" | "user" })
                    }
                  >
                    <option value="user">Usuario</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                {editForm.role === "user" && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-user-company">Empresa</Label>
                    <select
                      id="edit-user-company"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={editForm.companyId}
                      onChange={(e) => setEditForm({ ...editForm, companyId: e.target.value })}
                      required
                    >
                      <option value="">Selecione uma empresa</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingUser(null)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1">
                    Salvar
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
                <p className="text-sm font-medium text-muted-foreground">Total de Usuarios</p>
                <p className="text-3xl font-bold text-foreground">{users.length}</p>
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
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Administradores</p>
                <p className="text-3xl font-bold text-foreground">
                  {users.filter((u) => u.role === "admin").length}
                </p>
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

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Usuarios Comuns</p>
                <p className="text-3xl font-bold text-foreground">
                  {users.filter((u) => u.role === "user").length}
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
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
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
            placeholder="Buscar usuarios..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lista de Usuarios</CardTitle>
          <CardDescription>
            {filteredUsers.length} usuario{filteredUsers.length !== 1 ? "s" : ""} encontrado
            {filteredUsers.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum usuario encontrado.
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 bg-primary text-white">
                      <AvatarFallback className="bg-primary text-white text-sm font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      {user.companyId && (
                        <p className="text-xs text-primary/70 mt-0.5">
                          {getCompanyById(user.companyId)?.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                      {user.role === "admin" ? "Admin" : "Usuario"}
                    </Badge>
                    {user.companyId && (
                      <Badge variant="outline" className="hidden md:flex">
                        {getCompanyById(user.companyId)?.name.split(" ")[0]}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground hidden lg:block">
                      Criado em {user.createdAt}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                      onClick={() => handleStartEdit(user)}
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
                      onClick={() => handleDeleteUser(user.id)}
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
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
