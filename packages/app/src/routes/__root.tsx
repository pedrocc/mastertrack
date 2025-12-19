import { Link, Outlet, createRootRoute, useNavigate } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { useState } from "react";
import { SupportChatWidget } from "../components/support-chat-widget";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../components/ui/sheet";
import { Toaster } from "../components/ui/toaster";
import { useAuth } from "../contexts/auth-context";
import { PageLoadingOverlay } from "../contexts/page-loading-context";
import { useRequests } from "../contexts/requests-context";
import { useSupportChat } from "../contexts/support-chat-context";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const { user, isAuthenticated, logout, isAdmin, isLoading } = useAuth();
  const { getUnseenStatusCount, getUnseenByAdminCount } = useRequests();
  const { getUnreadCountForAdmin } = useSupportChat();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  // Show loading until auth is ready
  if (isLoading) {
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
      {/* Page loading overlay - controlled via DOM manipulation */}
      <PageLoadingOverlay />

      {/* Header - Only show when authenticated */}
      {isAuthenticated && (
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-border">
          <div className="container flex h-16 items-center justify-between">
            {/* Logo and Nav */}
            <div className="flex items-center gap-4 md:gap-8">
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Abrir menu"
              >
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
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </svg>
              </Button>

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

      {/* Mobile Menu Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-72">
          <SheetHeader className="text-left">
            <SheetTitle className="flex items-center gap-3">
              <img src="/logo.png" alt="Masterboi" className="w-8 h-8 rounded-lg" />
              <span className="brand-logo text-lg">
                Master<span className="text-primary">track</span>
              </span>
            </SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 mt-6">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors [&.active]:text-primary [&.active]:bg-primary/5"
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
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Dashboard
            </Link>
            {!isAdmin && (
              <Link
                to="/requests"
                onClick={() => setMobileMenuOpen(false)}
                className="relative flex items-center gap-3 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors [&.active]:text-primary [&.active]:bg-primary/5"
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
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                Requisicoes
                {clientUnseenRequests > 0 && (
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                    {clientUnseenRequests > 9 ? "9+" : clientUnseenRequests}
                  </span>
                )}
              </Link>
            )}
            {isAdmin && (
              <>
                <Link
                  to="/admin/requests"
                  onClick={() => setMobileMenuOpen(false)}
                  className="relative flex items-center gap-3 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors [&.active]:text-primary [&.active]:bg-primary/5"
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
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  Requisicoes
                  {adminUnseenRequests > 0 && (
                    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                      {adminUnseenRequests > 9 ? "9+" : adminUnseenRequests}
                    </span>
                  )}
                </Link>
                <Link
                  to="/admin/messages"
                  onClick={() => setMobileMenuOpen(false)}
                  className="relative flex items-center gap-3 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors [&.active]:text-primary [&.active]:bg-primary/5"
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
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  Mensagens
                  {unreadMessages > 0 && (
                    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                      {unreadMessages > 9 ? "9+" : unreadMessages}
                    </span>
                  )}
                </Link>
                <Link
                  to="/admin/companies"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors [&.active]:text-primary [&.active]:bg-primary/5"
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
                    <path d="M3 21h18" />
                    <path d="M5 21V7l8-4v18" />
                    <path d="M19 21V11l-6-4" />
                    <path d="M9 9v.01" />
                    <path d="M9 12v.01" />
                    <path d="M9 15v.01" />
                    <path d="M9 18v.01" />
                  </svg>
                  Empresas
                </Link>
                <Link
                  to="/admin/users"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors [&.active]:text-primary [&.active]:bg-primary/5"
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
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  Usuarios
                </Link>
                <Link
                  to="/admin/sla-settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors [&.active]:text-primary [&.active]:bg-primary/5"
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
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  SLA
                </Link>
              </>
            )}
          </nav>

          {/* User info and logout in mobile menu */}
          <div className="absolute bottom-0 left-0 right-0 border-t p-4">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-10 w-10 bg-primary text-white">
                <AvatarFallback className="bg-primary text-white text-sm font-semibold">
                  {avatarLetter}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-foreground">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
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
            </Button>
          </div>
        </SheetContent>
      </Sheet>

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
