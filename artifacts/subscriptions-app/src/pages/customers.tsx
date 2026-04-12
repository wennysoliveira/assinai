import { useState } from "react";
import {
  useListCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  getListCustomersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { formatDate, formatCpfCnpj } from "@/lib/utils";
import { Plus, Search, Pencil, Trash2, Users } from "lucide-react";

interface CustomerForm {
  name: string;
  whatsapp: string;
  cpfCnpj: string;
  status: "active" | "inactive";
}

const emptyForm: CustomerForm = {
  name: "",
  whatsapp: "",
  cpfCnpj: "",
  status: "active",
};

export default function Customers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CustomerForm>(emptyForm);

  const params = {
    ...(search ? { search } : {}),
    ...(statusFilter !== "all" ? { status: statusFilter as "active" | "inactive" } : {}),
  };

  const { data: customers, isLoading } = useListCustomers(params, {
    query: { queryKey: getListCustomersQueryKey(params) },
  });

  const createCustomer = useCreateCustomer({
    mutation: {
      onSuccess: () => {
        toast({ title: "Cliente criado com sucesso" });
        queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
        setDialogOpen(false);
        setForm(emptyForm);
      },
      onError: () => toast({ variant: "destructive", title: "Erro ao criar cliente" }),
    },
  });

  const updateCustomer = useUpdateCustomer({
    mutation: {
      onSuccess: () => {
        toast({ title: "Cliente atualizado com sucesso" });
        queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
        setDialogOpen(false);
        setEditingId(null);
        setForm(emptyForm);
      },
      onError: () => toast({ variant: "destructive", title: "Erro ao atualizar cliente" }),
    },
  });

  const deleteCustomer = useDeleteCustomer({
    mutation: {
      onSuccess: () => {
        toast({ title: "Cliente removido com sucesso" });
        queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
      },
      onError: () => toast({ variant: "destructive", title: "Erro ao remover cliente" }),
    },
  });

  const handleSubmit = () => {
    if (!form.name || !form.whatsapp || !form.cpfCnpj) {
      toast({ variant: "destructive", title: "Preencha todos os campos obrigatórios" });
      return;
    }
    if (editingId) {
      updateCustomer.mutate({ id: editingId, data: form });
    } else {
      createCustomer.mutate({ data: form });
    }
  };

  const handleEdit = (customer: { id: number; name: string; whatsapp: string; cpfCnpj: string; status: string }) => {
    setEditingId(customer.id);
    setForm({
      name: customer.name,
      whatsapp: customer.whatsapp,
      cpfCnpj: customer.cpfCnpj,
      status: customer.status as "active" | "inactive",
    });
    setDialogOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Clientes</h1>
          <p className="text-muted-foreground mt-1">Gerencie seus clientes e contatos.</p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2" data-testid="button-create-customer">
          <Plus className="w-4 h-4" />
          Novo Cliente
        </Button>
      </div>

      <Card className="shadow-sm border-border">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search-customers"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40" data-testid="select-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
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
          ) : !customers?.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Users className="w-12 h-12 mb-4 opacity-30" />
              <p className="text-sm">Nenhum cliente encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>CPF/CNPJ</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.whatsapp}</TableCell>
                      <TableCell>{formatCpfCnpj(customer.cpfCnpj)}</TableCell>
                      <TableCell>
                        <Badge variant={customer.status === "active" ? "default" : "secondary"}>
                          {customer.status === "active" ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(customer.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(customer)} data-testid={`button-edit-customer-${customer.id}`}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteCustomer.mutate({ id: customer.id })}
                            data-testid={`button-delete-customer-${customer.id}`}
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
            <DialogTitle>{editingId ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nome completo"
                data-testid="input-customer-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                placeholder="5511999999999"
                data-testid="input-customer-whatsapp"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
              <Input
                id="cpfCnpj"
                value={form.cpfCnpj}
                onChange={(e) => setForm({ ...form, cpfCnpj: e.target.value })}
                placeholder="000.000.000-00"
                data-testid="input-customer-cpfcnpj"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as "active" | "inactive" })}>
                <SelectTrigger data-testid="select-customer-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleSubmit}
              disabled={createCustomer.isPending || updateCustomer.isPending}
              data-testid="button-save-customer"
            >
              {editingId ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
