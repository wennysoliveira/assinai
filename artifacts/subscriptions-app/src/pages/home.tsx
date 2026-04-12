import { Link } from "wouter";
import { CreditCard, BarChart3, Bell, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 sm:px-10 border-b border-border">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-foreground">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground">
            <CreditCard className="w-5 h-5" />
          </div>
          <span>Recorrente</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/sign-in">
            <Button variant="ghost">Entrar</Button>
          </Link>
          <Link href="/sign-up">
            <Button>Criar conta</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center py-20">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium text-white mb-6"
          style={{ background: "linear-gradient(135deg, #6d28d9, #4c1d95)" }}
        >
          <Shield className="w-4 h-4" />
          Gestão de Assinaturas Recorrentes
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground max-w-2xl leading-tight mb-4">
          Controle suas assinaturas com{" "}
          <span className="text-primary">simplicidade</span>
        </h1>

        <p className="text-lg text-muted-foreground max-w-xl mb-8">
          Gerencie clientes, cobranças PIX recorrentes e notificações via WhatsApp em um só lugar.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/sign-up">
            <Button size="lg" className="gap-2 px-8">
              Começar gratuitamente
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button size="lg" variant="outline" className="gap-2 px-8">
              Já tenho conta
            </Button>
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-20 max-w-3xl w-full text-left">
          {[
            {
              icon: CreditCard,
              title: "Cobranças PIX",
              desc: "Gere cobranças PIX automaticamente para cada assinatura no vencimento.",
              gradient: "linear-gradient(135deg, #6d28d9, #4c1d95)",
            },
            {
              icon: Bell,
              title: "WhatsApp",
              desc: "Envie lembretes e confirmações de pagamento direto pelo WhatsApp.",
              gradient: "linear-gradient(135deg, #059669, #065f46)",
            },
            {
              icon: BarChart3,
              title: "Dashboard",
              desc: "Acompanhe MRR, churn e inadimplência com métricas em tempo real.",
              gradient: "linear-gradient(135deg, #2563eb, #1e3a8a)",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                style={{ background: f.gradient }}
              >
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border">
        © {new Date().getFullYear()} Recorrente. Todos os direitos reservados.
      </footer>
    </div>
  );
}
