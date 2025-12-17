import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useAuth } from "../contexts/auth-context";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate({ to: "/" });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
      navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-black via-neutral-900 to-black relative overflow-hidden">
        {/* Geometric patterns */}
        <div className="absolute inset-0">
          {/* Red accent lines */}
          <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
          <div className="absolute bottom-0 left-0 w-2/3 h-1 bg-primary" />
          <div className="absolute top-0 right-0 w-1 h-1/2 bg-primary" />

          {/* Diagonal red stripe */}
          <div className="absolute -left-20 top-1/4 w-96 h-2 bg-primary rotate-45 opacity-60" />
          <div className="absolute -right-20 bottom-1/3 w-96 h-2 bg-primary -rotate-45 opacity-60" />

          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />

          {/* Glowing orb */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="animate-slide-in-left">
            {/* Logo mark */}
            <div className="mb-8 flex items-center gap-4">
              <div className="w-14 h-14 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/30">
                <span className="text-2xl font-black text-white">M</span>
              </div>
              <div className="h-14 w-px bg-white/20" />
              <span className="text-sm font-medium tracking-widest text-white/60 uppercase">
                Sistema de Gestao
              </span>
            </div>

            {/* Brand name */}
            <h1 className="brand-logo text-6xl text-white mb-4">
              Master<span className="text-primary">track</span>
            </h1>

            {/* Tagline */}
            <p className="text-xl text-white/60 font-light max-w-md leading-relaxed">
              Controle total sobre seus processos. Visibilidade completa. Resultados precisos.
            </p>

            {/* Feature highlights */}
            <div className="mt-12 space-y-4">
              {[
                "Gestao de usuarios simplificada",
                "Dashboard em tempo real",
                "Relatorios inteligentes",
              ].map((feature, i) => (
                <div
                  key={feature}
                  className="flex items-center gap-3 text-white/50 animate-fade-in-up"
                  style={{ animationDelay: `${300 + i * 100}ms` }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Mobile logo */}
          <div className="lg:hidden mb-12 text-center">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-xl font-black text-white">M</span>
              </div>
            </div>
            <h1 className="brand-logo text-4xl text-foreground">
              Master<span className="text-primary">track</span>
            </h1>
          </div>

          {/* Form header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Bem-vindo de volta</h2>
            <p className="text-muted-foreground">
              Entre com suas credenciais para acessar o sistema
            </p>
          </div>

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error message */}
            {error && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200 animate-scale-in">
                <p className="text-sm text-red-600 flex items-center gap-2">
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
                  {error}
                </p>
              </div>
            )}

            {/* Email field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 px-4 bg-white border-border focus:border-primary focus:ring-primary/20 transition-all"
                required
                autoComplete="email"
              />
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Senha
                </Label>
                <button
                  type="button"
                  className="text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 px-4 bg-white border-border focus:border-primary focus:ring-primary/20 transition-all"
                required
                autoComplete="current-password"
              />
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Entrando...
                </span>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          {/* Demo credentials */}
          <div className="mt-8 p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              Credenciais de teste
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Admin:</span>
                <code className="text-xs bg-white px-2 py-1 rounded border">
                  admin@mastertrack.com / admin123
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Usuario:</span>
                <code className="text-xs bg-white px-2 py-1 rounded border">
                  user@mastertrack.com / user123
                </code>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-muted-foreground">
            Ao entrar, voce concorda com nossos{" "}
            <button type="button" className="text-primary hover:underline">
              Termos de Uso
            </button>{" "}
            e{" "}
            <button type="button" className="text-primary hover:underline">
              Politica de Privacidade
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
