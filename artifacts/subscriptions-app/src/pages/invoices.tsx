import { useState } from "react";
import {
  useListInvoices,
  useGeneratePixCharge,
  useSendPaymentReminder,
  getListInvoicesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { QrCode, MessageSquare, Receipt, Copy, Check } from "lucide-react";

export default function Invoices() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pixDialogOpen, setPixDialogOpen] = useState(false);
  const [pixData, setPixData] = useState<{ qrCode: string; pixCopiaECola: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const params = {
    ...(statusFilter !== "all" ? { status: statusFilter as "pending" | "paid" | "overdue" | "cancelled" } : {}),
  };

  const { data: invoices, isLoading } = useListInvoices(params, {
    query: { queryKey: getListInvoicesQueryKey(params) },
  });

  const generatePix = useGeneratePixCharge({
    mutation: {
      onSuccess: (data) => {
        setPixData({ qrCode: data.qrCode, pixCopiaECola: data.pixCopiaECola });
        setPixDialogOpen(true);
        queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
        toast({ title: "Cobrança PIX gerada com sucesso" });
      },
      onError: () => toast({ variant: "destructive", title: "Erro ao gerar cobrança PIX" }),
    },
  });

  const sendReminder = useSendPaymentReminder({
    mutation: {
      onSuccess: (data) => {
        toast({
          title: data.success ? "Lembrete enviado" : "Falha ao enviar lembrete",
          description: data.message,
          variant: data.success ? "default" : "destructive",
        });
      },
      onError: () => toast({ variant: "destructive", title: "Erro ao enviar lembrete" }),
    },
  });

  const handleCopyPix = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast({ title: "Código PIX copiado!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="default" className="bg-emerald-600">Pago</Badge>;
      case "pending":
        return <Badge variant="secondary">Pendente</Badge>;
      case "overdue":
        return <Badge variant="destructive">Atrasado</Badge>;
      case "cancelled":
        return <Badge variant="outline">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Faturas</h1>
          <p className="text-muted-foreground mt-1">Controle de cobranças e pagamentos.</p>
        </div>
      </div>

      <Card className="shadow-sm border-border">
        <CardHeader className="pb-4">
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40" data-testid="select-invoice-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="overdue">Atrasado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !invoices?.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Receipt className="w-12 h-12 mb-4 opacity-30" />
              <p className="text-sm">Nenhuma fatura encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Pago em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                      <TableCell className="font-mono text-xs text-muted-foreground">#{invoice.id}</TableCell>
                      <TableCell className="font-medium">{invoice.customerName || "-"}</TableCell>
                      <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                      <TableCell>{statusBadge(invoice.status)}</TableCell>
                      <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                      <TableCell>{invoice.paidAt ? formatDate(invoice.paidAt) : "-"}</TableCell>
                      <TableCell className="text-right">
                        {invoice.status === "pending" || invoice.status === "overdue" ? (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => generatePix.mutate({ id: invoice.id })}
                              disabled={generatePix.isPending}
                              title="Gerar PIX"
                              data-testid={`button-generate-pix-${invoice.id}`}
                            >
                              <QrCode className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => sendReminder.mutate({ id: invoice.id })}
                              disabled={sendReminder.isPending}
                              title="Enviar lembrete WhatsApp"
                              data-testid={`button-send-reminder-${invoice.id}`}
                            >
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : invoice.pixCode ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setPixData({ qrCode: invoice.pixQrCode || "", pixCopiaECola: invoice.pixCode || "" });
                              setPixDialogOpen(true);
                            }}
                            title="Ver PIX"
                            data-testid={`button-view-pix-${invoice.id}`}
                          >
                            <QrCode className="w-4 h-4" />
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={pixDialogOpen} onOpenChange={setPixDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cobrança PIX</DialogTitle>
            <DialogDescription>
              Escaneie o QR Code ou copie o código PIX para efetuar o pagamento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {pixData?.qrCode && (
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-lg border">
                  <img src={pixData.qrCode} alt="QR Code PIX" className="w-48 h-48" />
                </div>
              </div>
            )}
            {pixData?.pixCopiaECola && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Copia e Cola:</p>
                <div className="flex gap-2">
                  <code className="flex-1 p-3 bg-muted rounded-md text-xs break-all font-mono">
                    {pixData.pixCopiaECola}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopyPix(pixData.pixCopiaECola)}
                    data-testid="button-copy-pix"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
