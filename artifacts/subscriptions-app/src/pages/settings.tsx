import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings2, Webhook, MessageSquare, CreditCard } from "lucide-react";

export default function Settings() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Configurações</h1>
        <p className="text-muted-foreground mt-1">Gerencie as integrações e configurações do sistema.</p>
      </div>

      <div className="grid gap-6">
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
              <Input value="Configurado via variável de ambiente" disabled data-testid="input-qqpag-url" />
              <p className="text-xs text-muted-foreground">Variável: QQPAG_BASE_URL</p>
            </div>
            <div className="space-y-2">
              <Label>Token de Autenticação</Label>
              <Input value="**********" type="password" disabled data-testid="input-qqpag-token" />
              <p className="text-xs text-muted-foreground">Variável: QQPAG_TOKEN</p>
            </div>
          </CardContent>
        </Card>

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
              <Input value="Configurado via variável de ambiente" disabled data-testid="input-uazapi-url" />
              <p className="text-xs text-muted-foreground">Variável: UAZAPI_BASE_URL</p>
            </div>
            <div className="space-y-2">
              <Label>Token de Autenticação</Label>
              <Input value="**********" type="password" disabled data-testid="input-uazapi-token" />
              <p className="text-xs text-muted-foreground">Variável: UAZAPI_TOKEN</p>
            </div>
          </CardContent>
        </Card>

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
                <Input
                  value="/api/webhooks/qqpag"
                  disabled
                  className="font-mono text-sm"
                  data-testid="input-webhook-url"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.origin + "/api/webhooks/qqpag");
                  }}
                  data-testid="button-copy-webhook"
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
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              O sistema verifica diariamente as assinaturas com vencimento no dia atual e gera cobranças PIX automaticamente, 
              enviando lembretes via WhatsApp para os clientes.
            </p>
            <p className="text-sm text-muted-foreground">
              Endpoint manual: <code className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">POST /api/billing/process-due</code>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
