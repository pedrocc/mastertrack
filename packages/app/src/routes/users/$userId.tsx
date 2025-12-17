import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
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
import { Skeleton } from "../../components/ui/skeleton";
import { useUser } from "../../hooks/useUsers";

export const Route = createFileRoute("/users/$userId")({
  component: UserPage,
});

function UserPage() {
  const { userId } = Route.useParams();
  const { data, isLoading, error } = useUser(userId);
  const user = data?.data;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-[100px]" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[200px]" />
            <Skeleton className="h-4 w-[150px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-4">
        <Link to="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Erro</CardTitle>
            <CardDescription>{error?.message ?? "Usuario nao encontrado"}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link to="/">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-xl">
                {user.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-2xl">{user.name}</CardTitle>
              <CardDescription className="text-base">{user.email}</CardDescription>
            </div>
            <Badge variant={user.role === "admin" ? "default" : "secondary"} className="text-sm">
              {user.role}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-2 text-sm">
            <div className="flex gap-2">
              <dt className="text-muted-foreground">ID:</dt>
              <dd className="font-mono">{user.id}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Criado em:</dt>
              <dd>{new Date(user.createdAt).toLocaleDateString("pt-BR")}</dd>
            </div>
            {user.updatedAt && (
              <div className="flex gap-2">
                <dt className="text-muted-foreground">Atualizado em:</dt>
                <dd>{new Date(user.updatedAt).toLocaleDateString("pt-BR")}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
