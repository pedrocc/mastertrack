import { Link, Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { Toaster } from "../components/ui/toaster";

const APP_NAME = import.meta.env["VITE_APP_NAME"] || "MyApp";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center gap-6">
          <Link to="/">
            <h1 className="text-xl font-bold">{APP_NAME}</h1>
          </Link>
          <nav className="flex gap-4">
            <Link
              to="/"
              className="text-muted-foreground hover:text-foreground [&.active]:text-foreground"
            >
              Home
            </Link>
          </nav>
        </div>
      </header>

      <main className="container py-8">
        <Outlet />
      </main>

      <Toaster />
      {import.meta.env["DEV"] && <TanStackRouterDevtools position="bottom-right" />}
    </div>
  );
}
