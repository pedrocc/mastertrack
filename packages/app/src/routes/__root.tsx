import { Link, Outlet, createRootRoute, useNavigate } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { SupportChatWidget } from "../components/support-chat-widget";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Toaster } from "../components/ui/toaster";
import { useAuth } from "../contexts/auth-context";
import { usePageLoadingState } from "../contexts/page-loading-context";
import { useRequests } from "../contexts/requests-context";
import { useSupportChat } from "../contexts/support-chat-context";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const { user, isAuthenticated, logout, isAdmin, isLoading } = useAuth();
  const isPageLoading = usePageLoadingState();
  const { getUnseenStatusCount, getUnseenByAdminCount } = useRequests();
  const { getUnreadCountForAdmin } = useSupportChat();
  const navigate = useNavigate();
  const unreadMessages = getUnreadCountForAdmin();
  // Badges de requisicoes
  const clientUnseenRequests = user?.companyId ? getUnseenStatusCount(user.companyId) : 0;
  const adminUnseenRequests = getUnseenByAdminCount();

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  // Get first letter of name for avatar
  const avatarLetter =
    user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U";

  // Show loading until auth + page data is completely ready
  // This prevents showing the header/layout before page data loads
  if (isLoading || (isAuthenticated && isPageLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img src="/logo.png" alt="Masterboi" className="w-12 h-12 rounded-lg animate-pulse" />
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Only show when authenticated */}
      {isAuthenticated && (
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-border">
          <div className="container flex h-16 items-center justify-between">
            {/* Logo and Nav */}
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-3 group">
                <img
                  src="/logo.png"
                  alt="Masterboi"
                  className="w-9 h-9 rounded-lg shadow-sm group-hover:shadow-md group-hover:shadow-primary/20 transition-shadow"
                />
                <span className="brand-logo text-xl text-foreground hidden sm:block">
                  Master<span className="text-primary">track</span>
                </span>
              </Link>

              <nav className="hidden md:flex items-center gap-1">
                <Link
                  to="/"
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors [&.active]:text-primary [&.active]:bg-primary/5"
                >
                  Dashboard
                </Link>
                {!isAdmin && (
                  <Link
                    to="/requests"
                    className="relative px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors [&.active]:text-primary [&.active]:bg-primary/5"
                  >
                    Requisicoes
                    {clientUnseenRequests > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                        {clientUnseenRequests > 9 ? "9+" : clientUnseenRequests}
                      </span>
                    )}
                  </Link>
                )}
                {isAdmin && (
                  <>
                    <Link
                      to="/admin/requests"
                      className="relative px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors [&.active]:text-primary [&.active]:bg-primary/5"
                    >
                      Requisicoes
                      {adminUnseenRequests > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                          {adminUnseenRequests > 9 ? "9+" : adminUnseenRequests}
                        </span>
                      )}
                    </Link>
                    <Link
                      to="/admin/messages"
                      className="relative px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors [&.active]:text-primary [&.active]:bg-primary/5"
                    >
                      Mensagens
                      {unreadMessages > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                          {unreadMessages > 9 ? "9+" : unreadMessages}
                        </span>
                      )}
                    </Link>
                    <Link
                      to="/admin/companies"
                      className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors [&.active]:text-primary [&.active]:bg-primary/5"
                    >
                      Empresas
                    </Link>
                    <Link
                      to="/admin/users"
                      className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors [&.active]:text-primary [&.active]:bg-primary/5"
                    >
                      Usuarios
                    </Link>
                    <Link
                      to="/admin/sla-settings"
                      className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors [&.active]:text-primary [&.active]:bg-primary/5"
                    >
                      SLA
                    </Link>
                  </>
                )}
              </nav>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-2">
              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-3 p-2 pr-4 rounded-full hover:bg-muted transition-colors outline-none focus:ring-2 focus:ring-primary/20">
                  <Avatar className="h-8 w-8 bg-primary text-white">
                    <AvatarFallback className="bg-primary text-white text-sm font-semibold">
                      {avatarLetter}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-foreground leading-tight">
                      {user?.name}
                    </p>
                    <p className="text-xs text-muted-foreground leading-tight capitalize">
                      {user?.role}
                    </p>
                  </div>
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
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="mr-2 h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
      )}

      {/* Main content */}
      {isAuthenticated ? (
        <main className="container py-8">
          <Outlet />
        </main>
      ) : (
        <Outlet />
      )}

      <Toaster />
      {/* Support Chat Widget - Only for clients */}
      {isAuthenticated && !isAdmin && <SupportChatWidget />}
      {import.meta.env["DEV"] && <TanStackRouterDevtools position="bottom-right" />}
    </div>
  );
}
