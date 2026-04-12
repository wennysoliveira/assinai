import { Link } from "wouter";
import {
  CreditCard,
  BarChart3,
  Bell,
  Users,
  Zap,
  Shield,
  TrendingUp,
  MessageCircle,
  CheckCircle2,
  ArrowRight,
  Layers,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: CreditCard,
    title: "Cobranças PIX automáticas",
    desc: "Gere cobranças PIX no vencimento de cada assinatura sem precisar fazer nada manualmente.",
    gradient: "linear-gradient(135deg, #7c3aed, #4c1d95)",
  },
  {
    icon: MessageCircle,
    title: "Notificações via WhatsApp",
    desc: "Envie lembretes de pagamento e confirmações automaticamente para cada cliente.",
    gradient: "linear-gradient(135deg, #059669, #064e3b)",
  },
  {
    icon: BarChart3,
    title: "Dashboard com métricas",
    desc: "Acompanhe MRR, churn, inadimplência e receita em tempo real com gráficos interativos.",
    gradient: "linear-gradient(135deg, #2563eb, #1e3a8a)",
  },
  {
    icon: Users,
    title: "Gestão de clientes",
    desc: "Cadastre e gerencie seus clientes com histórico completo de assinaturas e faturas.",
    gradient: "linear-gradient(135deg, #db2777, #831843)",
  },
  {
    icon: Layers,
    title: "Planos e serviços",
    desc: "Crie serviços com diferentes planos mensais ou anuais e vincule a qualquer cliente.",
    gradient: "linear-gradient(135deg, #d97706, #78350f)",
  },
  {
    icon: Receipt,
    title: "Histórico de faturas",
    desc: "Visualize todas as faturas com status, datas e códigos PIX gerados.",
    gradient: "linear-gradient(135deg, #0891b2, #164e63)",
  },
];

const stats = [
  { label: "Cobranças automatizadas", value: "100%" },
  { label: "Integração PIX nativa", value: "QQPag" },
  { label: "WhatsApp em tempo real", value: "Uazapi" },
  { label: "Disponibilidade", value: "24/7" },
];

const benefits = [
  "Cobrança automática diária às 8h",
  "Webhook de confirmação de pagamento",
  "Suporte a assinaturas mensais e anuais",
  "Personalização de cores do sistema",
  "Relatórios de inadimplência",
  "Histórico completo por cliente",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      {/* Nav */}
      <header className="h-16 flex items-center justify-between px-6 sm:px-12 border-b border-border sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-foreground">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4c1d95)" }}
          >
            <CreditCard className="w-4 h-4" />
          </div>
          assin<span className="text-primary">AI</span>
        </div>
        <Link href="/login">
          <Button className="gap-2">
            Entrar <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </header>

      {/* Hero */}
      <section className="relative flex flex-col items-center text-center px-6 pt-20 pb-28 overflow-hidden">
        {/* Background decoration */}
        <div
          className="absolute inset-0 -z-10 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 0%, #7c3aed 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full -z-10 blur-3xl opacity-[0.08]"
          style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}
        />

        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold text-white mb-6 shadow"
          style={{ background: "linear-gradient(135deg, #7c3aed, #4c1d95)" }}
        >
          <Zap className="w-3.5 h-3.5" />
          Gestão de Assinaturas com IA
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground max-w-3xl leading-[1.1] mb-5">
          Cobranças recorrentes{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: "linear-gradient(135deg, #7c3aed, #2563eb)",
            }}
          >
            sem esforço
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed mb-10">
          Automatize cobranças PIX, envie notificações via WhatsApp e acompanhe
          métricas do seu negócio em um painel completo e moderno.
        </p>

        <Link href="/login">
          <Button size="lg" className="gap-2 px-8 text-base h-12 shadow-lg">
            Acessar o painel <ArrowRight className="w-5 h-5" />
          </Button>
        </Link>

        {/* Stats bar */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 w-full max-w-2xl">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold text-foreground">{s.value}</span>
              <span className="text-xs text-muted-foreground text-center leading-tight">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Feature grid */}
      <section className="px-6 sm:px-12 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Do cadastro do cliente à confirmação do pagamento, o assinAI
              cuida de todo o ciclo de cobrança para você.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-border bg-card p-6 space-y-4 hover:shadow-md transition-shadow"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-sm"
                  style={{ background: f.gradient }}
                >
                  <f.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits + CTA section */}
      <section
        className="px-6 sm:px-12 py-20"
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #1e3a8a 100%)",
        }}
      >
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-medium mb-4">
              <Shield className="w-3.5 h-3.5" />
              Por que o assinAI?
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
              Automatize e escale sem aumentar sua equipe
            </h2>
            <p className="text-white/70 leading-relaxed mb-8">
              Com processos manuais, cobranças atrasam e clientes ficam inadimplentes.
              O assinAI automatiza todo o ciclo de cobrança — você só acompanha os resultados.
            </p>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="gap-2 border-white/30 text-white hover:bg-white/10 hover:text-white bg-transparent"
              >
                Acessar agora <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {benefits.map((b) => (
              <div
                key={b}
                className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-white text-sm">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard preview hint */}
      <section className="px-6 sm:px-12 py-20 bg-muted/30">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-6 sm:gap-12">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0"
            style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}
          >
            <TrendingUp className="w-7 h-7" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-xl font-bold text-foreground mb-1">
              Métricas que importam, na hora certa
            </h3>
            <p className="text-muted-foreground">
              MRR, churn, inadimplência, receita do dia — tudo visível no painel
              assim que você faz login.
            </p>
          </div>
          <Link href="/login" className="shrink-0">
            <Button size="lg" className="gap-2 px-6">
              Ver o painel <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border">
        © {new Date().getFullYear()} assinAI. Todos os direitos reservados.
      </footer>
    </div>
  );
}
