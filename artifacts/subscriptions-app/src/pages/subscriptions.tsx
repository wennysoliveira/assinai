import { useState } from "react";
import {
  useListSubscriptions,
  useCreateSubscription,
  useUpdateSubscription,
  useDeleteSubscription,
  useListCustomers,
  useListServices,
  getListSubscriptionsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Pencil, Trash2, CreditCard } from "lucide-react";

interface SubscriptionForm {
  customerId: number;
  serviceId: number | null;
  plan: string;
  periodicity: "monthly" | "annual";
  amount: number;
  nextBillingDate: string;
}

const emptyForm: SubscriptionForm = {
  customerId: 0,
  serviceId: null,
  plan: "",
  periodicity: "monthly",
  amount: 0,
  nextBillingDate: new Date().toISOString().split("T")[0],
};

export default function Subscriptions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<SubscriptionForm>(emptyForm);

  const params = {
    ...(statusFilter !== "all" ? { status: statusFilter as "active" | "cancelled" | "overdue" } : {}),
  };

  const { data: subscriptions, isLoading } = useListSubscriptions(params, {
    query: { queryKey: getListSubscriptionsQueryKey(params) },
  });

  const { data: customers } = useListCustomers(undefined, {
    query: { queryKey: ["/api/customers"] },
  });

  const { data: services } = useListServices();

  const createSubscription = useCreateSubscription({
    mutation: {
      onSuccess: () => {
        toast({ title: "Assinatura criada com sucesso" });
        queryClient.invalidateQueries({ queryKey: getListSubscriptionsQueryKey() });
        setDialogOpen(false);
        setForm(emptyForm);
      },
      onError: () => toast({ variant: "destructive", title: "Erro ao criar assinatura" }),
    },
  });

  const updateSubscription = useUpdateSubscription({
    mutation: {
      onSuccess: () => {
        toast({ title: "Assinatura atualizada com sucesso" });
        queryClient.invalidateQueries({ queryKey: getListSubscriptionsQueryKey() });
        setDialogOpen(false);
        setEditingId(null);
        setForm(emptyForm);
      },
      onError: () => toast({ variant: "destructive", title: "Erro ao atualizar assinatura" }),
    },
  });

  const deleteSubscription = useDeleteSubscription({
    mutation: {
      onSuccess: () => {
        toast({ title: "Assinatura cancelada com sucesso" });
        queryClient.invalidateQueries({ queryKey: getListSubscriptionsQueryKey() });
      },
      onError: () => toast({ variant: "destructive", title: "Erro ao cancelar assinatura" }),
    },
  });

  const handleSubmit = () => {
    if (!form.plan || !form.customerId || form.amount <= 0) {
      toast({ variant: "destructive", title: "Preencha todos os campos obrigatórios" });
      return;
    }
    if (editingId) {
      updateSubscription.mutate({
        id: editingId,
        data: {
          serviceId: form.serviceId,
          plan: form.plan,
          periodicity: form.periodicity,
          amount: form.amount,
          nextBillingDate: new Date(form.nextBillingDate).toISOString(),
        },
      });
    } else {
      createSubscription.mutate({
        data: {
          ...form,
          nextBillingDate: new Date(form.nextBillingDate).toISOString(),
        },
      });
    }
  };

  const handleEdit = (sub: { id: number; plan: string; periodicity: string; amount: number; nextBillingDate: string; customerId: number; serviceId?: number | null }) => {
    setEditingId(sub.id);
    setForm({
      customerId: sub.customerId,
      serviceId: sub.serviceId ?? null,
      plan: sub.plan,
      periodicity: sub.periodicity as "monthly" | "annual",
      amount: sub.amount,
      nextBillingDate: new Date(sub.nextBillingDate).toISOString().split("T")[0],
    });
    setDialogOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Ativa</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Cancelada</Badge>;
      case "overdue":
        return <Badge variant="destructive">Atrasada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Assinaturas</h1>
          <p className="text-muted-foreground mt-1">Controle de assinaturas recorrentes.</p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2" data-testid="button-create-subscription">
          <Plus className="w-4 h-4" />
          Nova Assinatura
        </Button>
      </div>

      <Card className="shadow-sm border-border">
        <CardHeader className="pb-4">
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40" data-testid="select-subscription-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativa</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
                <SelectItem value="overdue">Atrasada</SelectItem>
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
          ) : !subscriptions?.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <CreditCard className="w-12 h-12 mb-4 opacity-30" />
              <p className="text-sm">Nenhuma assinatura encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Serviço / Plano</TableHead>
                    <TableHead>Periodicidade</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Próxima Cobrança</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((sub) => (
                    <TableRow key={sub.id} data-testid={`row-subscription-${sub.id}`}>
                      <TableCell className="font-medium">{sub.customerName || "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          {sub.serviceName && (
                            <span className="text-xs text-muted-foreground">{sub.serviceName}</span>
                          )}
                          <span className="font-medium text-sm">{sub.plan}</span>
                        </div>
                      </TableCell>
                      <TableCell>{sub.periodicity === "monthly" ? "Mensal" : "Anual"}</TableCell>
                      <TableCell>{formatCurrency(sub.amount)}</TableCell>
                      <TableCell>{statusBadge(sub.status)}</TableCell>
                      <TableCell>{formatDate(sub.nextBillingDate)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(sub)} data-testid={`button-edit-subscription-${sub.id}`}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteSubscription.mutate({ id: sub.id })}
                            data-testid={`button-delete-subscription-${sub.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Assinatura" : "Nova Assinatura"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Atualize os dados da assinatura." : "Crie uma nova assinatura recorrente para um cliente."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!editingId && (
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select
                  value={form.customerId ? String(form.customerId) : ""}
                  onValueChange={(v) => setForm({ ...form, customerId: Number(v) })}
                >
                  <SelectTrigger data-testid="select-subscription-customer">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers?.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Serviço</Label>
              <Select
                value={form.serviceId ? String(form.serviceId) : "none"}
                onValueChange={(v) => setForm({ ...form, serviceId: v === "none" ? null : Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um serviço (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {services?.filter((s) => s.active).map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan">Plano</Label>
              <Input
                id="plan"
                value={form.plan}
                onChange={(e) => setForm({ ...form, plan: e.target.value })}
                placeholder="Ex: Plano Pro"
                data-testid="input-subscription-plan"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Periodicidade</Label>
                <Select value={form.periodicity} onValueChange={(v) => setForm({ ...form, periodicity: v as "monthly" | "annual" })}>
                  <SelectTrigger data-testid="select-subscription-periodicity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="annual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Valor (R$)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={form.amount || ""}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                  placeholder="0.00"
                  data-testid="input-subscription-amount"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nextBillingDate">Próxima Cobrança</Label>
              <Input
                id="nextBillingDate"
                type="date"
                value={form.nextBillingDate}
                onChange={(e) => setForm({ ...form, nextBillingDate: e.target.value })}
                data-testid="input-subscription-next-billing"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleSubmit}
              disabled={createSubscription.isPending || updateSubscription.isPending}
              data-testid="button-save-subscription"
            >
              {editingId ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
