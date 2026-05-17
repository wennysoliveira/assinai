import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode, MessageSquare, Receipt, Copy, Check, Pencil } from "lucide-react";

export default function Invoices() {
  const apiBase = `${import.meta.env.BASE_URL}api`;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [subscriptionIdFilter, setSubscriptionIdFilter] = useState<string>("");
  const [pixDialogOpen, setPixDialogOpen] = useState(false);
  const [pixData, setPixData] = useState<{
    invoiceId: number;
    amount: number;
    qrCode: string;
    pixCopiaECola: string;
    externalId?: string | null;
    customerName?: string;
    dueDate?: string;
    status?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<{
    id: number;
    amount: string;
    dueDate: string;
    status: "pending" | "paid" | "overdue" | "cancelled";
  } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const subscriptionId = params.get("subscriptionId") || "";
    setSubscriptionIdFilter(subscriptionId);
  }, []);

  const params = {
    ...(statusFilter !== "all" ? { status: statusFilter as "pending" | "paid" | "overdue" | "cancelled" } : {}),
    ...(subscriptionIdFilter ? { subscriptionId: Number(subscriptionIdFilter) } : {}),
  };

  const { data: invoices, isLoading } = useListInvoices(params, {
    query: { queryKey: getListInvoicesQueryKey(params) },
  });

  const generatePix = useGeneratePixCharge({
    mutation: {
      onSuccess: (data) => {
        const invoice = invoices?.find((item) => item.id === data.invoiceId);
        const qrCode = data.qrCode || invoice?.pixQrCode || "";
        const pixCopiaECola = data.pixCopiaECola || invoice?.pixCode || "";
        setPixData({
          invoiceId: data.invoiceId,
          amount: invoice?.amount ?? 0,
          qrCode,
          pixCopiaECola,
          externalId: data.externalId,
          customerName: invoice?.customerName,
          dueDate: invoice?.dueDate,
          status: invoice?.status,
        });
        setPixDialogOpen(true);
        queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
        toast({ title: "Cobrança PIX gerada com sucesso" });
      },
      onError: (err: unknown) => {
        const apiErr = err as { status?: number; data?: { error?: string } };
        const message = apiErr?.data?.error || "Erro ao gerar cobrança PIX";
        toast({ variant: "destructive", title: message });
      },
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



  const openEditInvoice = (invoice: { id: number; amount: number; dueDate: string; status: "pending" | "paid" | "overdue" | "cancelled" }) => {
    setEditForm({
      id: invoice.id,
      amount: String(invoice.amount),
      dueDate: invoice.dueDate ? invoice.dueDate.slice(0, 10) : "",
      status: invoice.status,
    });
    setEditDialogOpen(true);
  };

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;

    const amountValue = Number(editForm.amount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      toast({ variant: "destructive", title: "Informe um valor válido" });
      return;
    }

    void (async () => {
      const res = await fetch(`${apiBase}/invoices/${editForm.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountValue,
          dueDate: editForm.dueDate,
          status: editForm.status,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Erro ao salvar fatura" }));
        toast({ variant: "destructive", title: data.error || "Erro ao salvar fatura" });
        return;
      }

      queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey(params) });
      setEditDialogOpen(false);
      setEditForm(null);
      toast({ title: "Fatura atualizada com sucesso" });
    })();
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
          <div className="flex flex-col gap-3 sm:flex-row">
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
            {subscriptionIdFilter && (
              <div className="text-sm text-muted-foreground flex items-center">
                Filtro aplicado para a assinatura #{subscriptionIdFilter}
              </div>
            )}
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
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditInvoice(invoice)}
                            title="Editar fatura"
                            data-testid={`button-edit-invoice-${invoice.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          {(invoice.status === "pending" || invoice.status === "overdue") && (
                            <>
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
                            </>
                          )}
                          {(invoice.status !== "pending" && invoice.status !== "overdue" && invoice.pixCode) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const qrCode = invoice.pixQrCode || "";
                                const pixCopiaECola = invoice.pixCode || "";
                                setPixData({
                                  invoiceId: invoice.id,
                                  amount: invoice.amount,
                                  qrCode,
                                  pixCopiaECola,
                                  externalId: invoice.externalId || null,
                                  customerName: invoice.customerName,
                                  dueDate: invoice.dueDate,
                                  status: invoice.status,
                                });
                                setPixDialogOpen(true);
                              }}
                              title="Ver PIX"
                              data-testid={`button-view-pix-${invoice.id}`}
                            >
                              <QrCode className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cobrança PIX #{pixData?.invoiceId ?? ""}</DialogTitle>
            <DialogDescription>
              Escaneie o QR Code ou copie o código PIX para efetuar o pagamento.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4 lg:grid-cols-[280px_1fr]">
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="text-xs uppercase text-muted-foreground">Valor</div>
                <div className="text-2xl font-semibold">{formatCurrency(pixData?.amount ?? 0)}</div>
              </div>
              <div className="rounded-lg border bg-white p-4">
                {pixData?.qrCode ? (
                  <img
                    src={pixData.qrCode}
                    alt="QR Code PIX"
                    className="w-full max-w-[240px] mx-auto"
                  />
                ) : pixData?.pixCopiaECola ? (
                  <div className="flex h-[240px] flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
                    <QrCode className="w-10 h-10 opacity-40" />
                    <span>QR Code não retornou da QQPag</span>
                    <span className="max-w-[220px] text-xs break-all text-foreground/80">
                      Use o PIX copia e cola abaixo para pagar.
                    </span>
                  </div>
                ) : (
                  <div className="flex h-[240px] flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
                    <QrCode className="w-10 h-10 opacity-40" />
                    <span>QR Code indisponível</span>
                    {pixData?.pixCopiaECola && (
                      <span className="max-w-[220px] text-xs break-all text-foreground/80">
                        Você ainda pode pagar usando o PIX copia e cola abaixo.
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <div className="text-xs uppercase text-muted-foreground">Fatura</div>
                  <div className="font-medium">#{pixData?.invoiceId ?? "-"}</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-xs uppercase text-muted-foreground">ID externo</div>
                  <div className="font-mono text-sm break-all">{pixData?.externalId || "-"}</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-xs uppercase text-muted-foreground">Cliente</div>
                  <div className="font-medium">{pixData?.customerName || "-"}</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-xs uppercase text-muted-foreground">Vencimento</div>
                  <div className="font-medium">{pixData?.dueDate ? formatDate(pixData.dueDate) : "-"}</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-xs uppercase text-muted-foreground">Status</div>
                  <div className="font-medium">{pixData?.status || "-"}</div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">PIX copia e cola</p>
                <div className="flex gap-2">
                  <code className="flex-1 rounded-md border bg-muted p-3 text-xs break-all font-mono">
                    {pixData?.pixCopiaECola || ""}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => pixData?.pixCopiaECola && handleCopyPix(pixData.pixCopiaECola)}
                    disabled={!pixData?.pixCopiaECola}
                    data-testid="button-copy-pix"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                {!pixData?.pixCopiaECola && (
                  <p className="text-xs text-muted-foreground">
                    Não foi possível carregar o código PIX nesta cobrança.
                  </p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar fatura #{editForm?.id ?? ""}</DialogTitle>
            <DialogDescription>Atualize os dados da fatura na listagem.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveInvoice} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="invoice-amount">Valor</Label>
              <Input
                id="invoice-amount"
                type="number"
                min="0"
                step="0.01"
                value={editForm?.amount ?? ""}
                onChange={(e) => setEditForm((prev) => (prev ? { ...prev, amount: e.target.value } : prev))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invoice-due-date">Vencimento</Label>
              <Input
                id="invoice-due-date"
                type="date"
                value={editForm?.dueDate ?? ""}
                onChange={(e) => setEditForm((prev) => (prev ? { ...prev, dueDate: e.target.value } : prev))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={editForm?.status ?? "pending"}
                onValueChange={(value: "pending" | "paid" | "overdue" | "cancelled") =>
                  setEditForm((prev) => (prev ? { ...prev, status: value } : prev))
                }
              >
                <SelectTrigger data-testid="select-edit-invoice-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="overdue">Atrasado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" data-testid="button-save-invoice-edit">Salvar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
