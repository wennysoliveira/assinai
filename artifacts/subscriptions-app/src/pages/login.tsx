import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  CreditCard,
  Eye,
  EyeOff,
  BarChart3,
  MessageCircle,
  Zap,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";

const highlights = [
  { icon: Zap, text: "Cobranças PIX totalmente automatizadas" },
  { icon: MessageCircle, text: "Notificações via WhatsApp em tempo real" },
  { icon: BarChart3, text: "Dashboard com MRR, churn e inadimplência" },
  { icon: CheckCircle2, text: "Webhook de confirmação de pagamento" },
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [, setLocation] = useLocation();
  const { login, loginError, isLoggingIn, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await login({ email, password });
      setLocation("/dashboard");
    } catch {
      // error shown via loginError
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — decorative */}
      <div
        className="hidden lg:flex lg:w-[55%] flex-col relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #1e1b4b 0%, #312e81 40%, #1d4ed8 100%)" }}
      >
        {/* Decorative circles */}
        <div
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #818cf8, transparent)" }}
        />
        <div
          className="absolute top-1/2 -right-32 w-80 h-80 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #60a5fa, transparent)" }}
        />
        <div
          className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #a78bfa, transparent)" }}
        />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20 shadow">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">assin<span className="text-indigo-300">AI</span></span>
          </div>

          {/* Center content */}
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-indigo-300 text-sm font-medium uppercase tracking-widest mb-4">
              Gestão de Assinaturas
            </p>
            <h2 className="text-white text-4xl font-extrabold leading-tight mb-6">
              Automatize suas<br />cobranças recorrentes
            </h2>
            <p className="text-indigo-200/80 text-lg leading-relaxed mb-10 max-w-md">
              Gerencie clientes, gere cobranças PIX e envie lembretes via WhatsApp — tudo em um só lugar.
            </p>

            <div className="space-y-4">
              {highlights.map((h) => (
                <div key={h.text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                    <h.icon className="w-4 h-4 text-indigo-300" />
                  </div>
                  <span className="text-indigo-100 text-sm">{h.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom stats */}
          <div className="flex gap-8">
            {[
              { value: "100%", label: "Automatizado" },
              { value: "PIX", label: "Nativo" },
              { value: "24/7", label: "Disponível" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-white font-bold text-xl">{s.value}</div>
                <div className="text-indigo-300 text-xs">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Top bar */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-border">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao início
          </Link>
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
              style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}
            >
              <CreditCard className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-foreground">assin<span className="text-primary">AI</span></span>
          </div>
          <div className="w-24 hidden lg:block" />
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-8 py-12">
          <div className="w-full max-w-md space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-md shrink-0"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}
                >
                  <CreditCard className="w-5 h-5" />
                </div>
                <span className="text-3xl font-extrabold text-foreground tracking-tight">
                  assin<span style={{ color: "#7c3aed" }}>AI</span>
                </span>
              </div>
              <p className="text-muted-foreground text-sm">
                Faça login para acessar o painel de gestão
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium">
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoggingIn}
                  className="h-11 bg-muted/40 border-border focus-visible:bg-background transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium">
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoggingIn}
                    className="h-11 bg-muted/40 border-border focus-visible:bg-background transition-colors pr-11"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                  {loginError}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 text-sm font-semibold shadow-md"
                disabled={isLoggingIn}
                style={
                  !isLoggingIn
                    ? { background: "linear-gradient(135deg, #7c3aed, #2563eb)" }
                    : undefined
                }
              >
                {isLoggingIn ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Entrando…
                  </span>
                ) : (
                  "Entrar no painel"
                )}
              </Button>
            </form>

            {/* Footer note */}
            <p className="text-center text-xs text-muted-foreground">
              Acesso restrito. Entre em contato com o administrador caso não tenha suas credenciais.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="px-8 py-4 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} assinAI — Gestão de Assinaturas
          </p>
        </div>
      </div>
    </div>
  );
}
