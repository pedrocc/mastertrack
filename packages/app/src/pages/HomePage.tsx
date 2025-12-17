import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { useUsers } from "../hooks/useUsers";

function UsersList() {
  const { data, isLoading, error } = useUsers();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-3 w-[150px]" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Erro</CardTitle>
          <CardDescription>{error.message}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const users = data?.data ?? [];

  return (
    <div className="space-y-4">
      {users.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhum usuario encontrado. Execute <code>bun run db:seed</code> para popular o banco.
          </CardContent>
        </Card>
      ) : (
        users.map((user) => (
          <Card key={user.id}>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg">{user.name}</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </div>
                <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
              </div>
            </CardHeader>
          </Card>
        ))
      )}
    </div>
  );
}

export function HomePage() {
  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight">Usuarios</h2>
        <p className="text-muted-foreground">Lista de usuarios cadastrados no sistema.</p>
      </div>

      <UsersList />
    </>
  );
}
