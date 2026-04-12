import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings2, Webhook, MessageSquare, CreditCard, Palette, RotateCcw, Check } from "lucide-react";
import { useThemeColor, applySidebarColor, applyPrimaryColor } from "@/hooks/use-theme-color";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const SIDEBAR_PRESETS = [
  { label: "Violeta", color: "#3b1d8a" },
  { label: "Índigo", color: "#1e1b4b" },
  { label: "Azul marinho", color: "#0c1a45" },
  { label: "Esmeralda", color: "#064e3b" },
  { label: "Verde", color: "#14532d" },
  { label: "Vermelho", color: "#450a0a" },
  { label: "Rosa", color: "#500724" },
  { label: "Grafite", color: "#0f172a" },
];

const PRIMARY_PRESETS = [
  { label: "Violeta", color: "#7c3aed" },
  { label: "Roxo", color: "#9333ea" },
  { label: "Índigo", color: "#4f46e5" },
  { label: "Azul", color: "#2563eb" },
  { label: "Ciano", color: "#0891b2" },
  { label: "Esmeralda", color: "#059669" },
  { label: "Rosa", color: "#db2777" },
  { label: "Laranja", color: "#ea580c" },
];

interface ColorSwatchGridProps {
  presets: { label: string; color: string }[];
  current: string;
  onChange: (hex: string) => void;
}

function ColorSwatchGrid({ presets, current, onChange }: ColorSwatchGridProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {presets.map((preset) => {
        const isSelected = current.toLowerCase() === preset.color.toLowerCase();
        return (
          <button
            key={preset.color}
            title={preset.label}
            onClick={() => onChange(preset.color)}
            className="relative w-9 h-9 rounded-lg border-2 transition-all hover:scale-110 focus:outline-none"
            style={{
              backgroundColor: preset.color,
              borderColor: isSelected ? "white" : "transparent",
              boxShadow: isSelected
                ? `0 0 0 3px ${preset.color}, 0 0 0 5px rgba(0,0,0,0.15)`
                : "0 1px 3px rgba(0,0,0,0.3)",
            }}
          >
            {isSelected && (
              <Check className="w-4 h-4 text-white absolute inset-0 m-auto drop-shadow" />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function Settings() {
  const { toast } = useToast();
  const {
    sidebarColor,
    primaryColor,
    setSidebarColor,
    setPrimaryColor,
    resetColors,
    defaultSidebar,
    defaultPrimary,
  } = useThemeColor();

  const [localSidebar, setLocalSidebar] = useState(sidebarColor);
  const [localPrimary, setLocalPrimary] = useState(primaryColor);

  const handleSidebarChange = (hex: string) => {
    setLocalSidebar(hex);
    applySidebarColor(hex);
  };

  const handlePrimaryChange = (hex: string) => {
    setLocalPrimary(hex);
    applyPrimaryColor(hex);
  };

  const handleSaveColors = () => {
    setSidebarColor(localSidebar);
    setPrimaryColor(localPrimary);
    toast({ title: "Cores salvas com sucesso!" });
  };

  const handleReset = () => {
    setLocalSidebar(defaultSidebar);
    setLocalPrimary(defaultPrimary);
    resetColors();
    toast({ title: "Cores restauradas para o padrão." });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Configurações</h1>
        <p className="text-muted-foreground mt-1">Gerencie as integrações e configurações do sistema.</p>
      </div>

      <div className="grid gap-6">

        {/* ── PERSONALIZAÇÃO ─────────────────────────────── */}
        <Card className="shadow-sm border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
                <Palette className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Personalização</CardTitle>
                <CardDescription>Escolha as cores do menu lateral e dos botões</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Preview */}
            <div className="rounded-xl overflow-hidden border border-border shadow-sm flex h-24">
              <div className="w-28 flex flex-col justify-between p-3" style={{ backgroundColor: localSidebar }}>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-sm" style={{ background: "rgba(255,255,255,0.3)" }} />
                  <div className="h-2 w-12 rounded-full bg-white/30" />
                </div>
                {["Dashboard","Clientes","Assinaturas"].map((item, i) => (
                  <div key={i} className="h-1.5 rounded-full" style={{ width: `${55 + i * 10}%`, background: "rgba(255,255,255,0.25)" }} />
                ))}
              </div>
              <div className="flex-1 bg-background p-3 flex flex-col gap-2 justify-center">
                <div className="h-2 w-32 rounded-full bg-muted" />
                <div className="flex gap-2">
                  <div className="h-7 w-20 rounded-md text-xs flex items-center justify-center text-white font-medium" style={{ backgroundColor: localPrimary }}>
                    Salvar
                  </div>
                  <div className="h-7 w-16 rounded-md border border-border bg-background text-xs flex items-center justify-center text-muted-foreground">
                    Cancelar
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar color */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="font-medium">Cor do Menu Lateral</Label>
                <div className="w-5 h-5 rounded-full border border-border shadow-sm" style={{ backgroundColor: localSidebar }} />
              </div>
              <ColorSwatchGrid
                presets={SIDEBAR_PRESETS}
                current={localSidebar}
                onChange={handleSidebarChange}
              />
              <div className="flex items-center gap-3">
                <Label className="text-sm text-muted-foreground shrink-0">Cor personalizada:</Label>
                <div className="relative">
                  <input
                    type="color"
                    value={localSidebar}
                    onChange={(e) => handleSidebarChange(e.target.value)}
                    className="w-10 h-10 rounded-lg border border-border cursor-pointer p-0.5"
                    style={{ backgroundColor: localSidebar }}
                  />
                </div>
                <span className="text-xs text-muted-foreground font-mono">{localSidebar.toUpperCase()}</span>
              </div>
            </div>

            {/* Primary color */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="font-medium">Cor dos Botões e Destaques</Label>
                <div className="w-5 h-5 rounded-full border border-border shadow-sm" style={{ backgroundColor: localPrimary }} />
              </div>
              <ColorSwatchGrid
                presets={PRIMARY_PRESETS}
                current={localPrimary}
                onChange={handlePrimaryChange}
              />
              <div className="flex items-center gap-3">
                <Label className="text-sm text-muted-foreground shrink-0">Cor personalizada:</Label>
                <div className="relative">
                  <input
                    type="color"
                    value={localPrimary}
                    onChange={(e) => handlePrimaryChange(e.target.value)}
                    className="w-10 h-10 rounded-lg border border-border cursor-pointer p-0.5"
                    style={{ backgroundColor: localPrimary }}
                  />
                </div>
                <span className="text-xs text-muted-foreground font-mono">{localPrimary.toUpperCase()}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Button onClick={handleSaveColors} className="gap-2">
                <Check className="w-4 h-4" />
                Salvar Cores
              </Button>
              <Button variant="outline" onClick={handleReset} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Restaurar Padrão
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── QQPAG ─────────────────────────────── */}
        <Card className="shadow-sm border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">QQPag (Pagamentos PIX)</CardTitle>
                <CardDescription>Configuração da API de cobranças PIX</CardDescription>
              </div>
              <Badge variant="default" className="ml-auto">Configurado</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>URL Base da API</Label>
              <Input value="Configurado via variável de ambiente" disabled />
              <p className="text-xs text-muted-foreground">Variável: QQPAG_BASE_URL</p>
            </div>
            <div className="space-y-2">
              <Label>Token de Autenticação</Label>
              <Input value="••••••••••••••••" disabled className="font-mono tracking-widest" />
              <p className="text-xs text-muted-foreground">Variável: QQPAG_TOKEN</p>
            </div>
          </CardContent>
        </Card>

        {/* ── UAZAPI ─────────────────────────────── */}
        <Card className="shadow-sm border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Uazapi (WhatsApp)</CardTitle>
                <CardDescription>Configuração da API de envio de mensagens WhatsApp</CardDescription>
              </div>
              <Badge variant="default" className="ml-auto">Configurado</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>URL Base da API</Label>
              <Input value="Configurado via variável de ambiente" disabled />
              <p className="text-xs text-muted-foreground">Variável: UAZAPI_BASE_URL</p>
            </div>
            <div className="space-y-2">
              <Label>Token de Autenticação</Label>
              <Input value="••••••••••••••••" disabled className="font-mono tracking-widest" />
              <p className="text-xs text-muted-foreground">Variável: UAZAPI_TOKEN</p>
            </div>
          </CardContent>
        </Card>

        {/* ── WEBHOOKS ─────────────────────────────── */}
        <Card className="shadow-sm border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Webhook className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Webhooks</CardTitle>
                <CardDescription>Endpoints para recebimento de notificações</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>URL do Webhook QQPag</Label>
              <div className="flex gap-2">
                <Input value="/api/webhooks/qqpag" disabled className="font-mono text-sm" />
                <Button
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(window.location.origin + "/api/webhooks/qqpag")}
                >
                  Copiar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Configure este URL no painel da QQPag para receber confirmações de pagamento automaticamente.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ── CRON ─────────────────────────────── */}
        <Card className="shadow-sm border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Settings2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Cron Jobs</CardTitle>
                <CardDescription>Processamento automático de cobranças</CardDescription>
              </div>
              <Badge variant="default" className="ml-auto bg-emerald-600">Ativo</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-2">
              <p className="text-sm font-medium">Cobrança Diária — 08:00 (America/Sao_Paulo)</p>
              <p className="text-sm text-muted-foreground">
                Todos os dias às 08h, o sistema processa automaticamente as assinaturas com vencimento no dia,
                cria as faturas, gera cobranças PIX e envia lembretes via WhatsApp.
                Faturas pendentes com data de vencimento passada são automaticamente marcadas como atrasadas.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Execução manual: <code className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">POST /api/billing/process-due</code>
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
