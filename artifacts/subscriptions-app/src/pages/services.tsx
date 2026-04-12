import { useState } from "react";
import {
  useListServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
  getListServicesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Layers } from "lucide-react";

interface ServiceForm {
  name: string;
  description: string;
  active: boolean;
}

const emptyForm: ServiceForm = { name: "", description: "", active: true };

export default function Services() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form, setForm] = useState<ServiceForm>(emptyForm);

  const { data: services = [], isLoading } = useListServices();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListServicesQueryKey() });

  const createMutation = useCreateService({
    mutation: {
      onSuccess: () => { invalidate(); setDialogOpen(false); setForm(emptyForm); toast({ title: "Serviço criado com sucesso!" }); },
      onError: () => toast({ title: "Erro ao criar serviço", variant: "destructive" }),
    },
  });

  const updateMutation = useUpdateService({
    mutation: {
      onSuccess: () => { invalidate(); setDialogOpen(false); setEditingId(null); setForm(emptyForm); toast({ title: "Serviço atualizado com sucesso!" }); },
      onError: () => toast({ title: "Erro ao atualizar serviço", variant: "destructive" }),
    },
  });

  const deleteMutation = useDeleteService({
    mutation: {
      onSuccess: () => { invalidate(); setDeleteDialogOpen(false); setDeletingId(null); toast({ title: "Serviço excluído com sucesso!" }); },
      onError: () => toast({ title: "Erro ao excluir serviço", variant: "destructive" }),
    },
  });

  const filtered = services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.description.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (s: typeof services[0]) => {
    setEditingId(s.id);
    setForm({ name: s.name, description: s.description, active: s.active });
    setDialogOpen(true);
  };
  const openDelete = (id: number) => { setDeletingId(id); setDeleteDialogOpen(true); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editingId !== null) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      createMutation.mutate({ data: form });
    }
  };

  const activeCount = services.filter((s) => s.active).length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Serviços</h1>
        <p className="text-muted-foreground">Gerencie os serviços oferecidos nas assinaturas.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="rounded-xl p-4 text-white shadow-md" style={{ background: "linear-gradient(135deg, #6d28d9, #4c1d95)" }}>
          <p className="text-sm font-medium opacity-80">Total</p>
          <p className="text-2xl font-bold">{services.length}</p>
        </div>
        <div className="rounded-xl p-4 text-white shadow-md" style={{ background: "linear-gradient(135deg, #059669, #065f46)" }}>
          <p className="text-sm font-medium opacity-80">Ativos</p>
          <p className="text-2xl font-bold">{activeCount}</p>
        </div>
        <div className="rounded-xl p-4 text-white shadow-md" style={{ background: "linear-gradient(135deg, #dc2626, #7f1d1d)" }}>
          <p className="text-sm font-medium opacity-80">Inativos</p>
          <p className="text-2xl font-bold">{services.length - activeCount}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar serviços..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={openCreate} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Novo Serviço
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden md:table-cell">Descrição</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">Carregando...</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Layers className="w-10 h-10 opacity-30" />
                    <p className="font-medium">Nenhum serviço encontrado</p>
                    <p className="text-sm">Crie um novo serviço para começar.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((service) => (
                <TableRow key={service.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground max-w-xs truncate">
                    {service.description || <span className="italic text-sm">Sem descrição</span>}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={service.active ? "default" : "secondary"}
                      className={service.active ? "bg-emerald-100 text-emerald-700 border-emerald-200" : ""}
                    >
                      {service.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(service)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => openDelete(service.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId !== null ? "Editar Serviço" : "Novo Serviço"}</DialogTitle>
            <DialogDescription>
              {editingId !== null
                ? "Atualize as informações do serviço."
                : "Preencha os dados para criar um novo serviço."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="svc-name">Nome do Serviço *</Label>
              <Input
                id="svc-name"
                placeholder="Ex: Hospedagem Web, Suporte Técnico..."
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="svc-description">Descrição</Label>
              <Textarea
                id="svc-description"
                placeholder="Descreva o serviço em detalhes..."
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <Label htmlFor="svc-active" className="font-medium">Ativo</Label>
                <p className="text-xs text-muted-foreground">Disponível para assinaturas</p>
              </div>
              <Switch
                id="svc-active"
                checked={form.active}
                onCheckedChange={(v) => setForm({ ...form, active: v })}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                className="flex-1"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingId !== null ? "Salvar Alterações" : "Criar Serviço"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este serviço? Assinaturas vinculadas perderão a associação.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button
              variant="destructive"
              className="flex-1"
              disabled={deleteMutation.isPending}
              onClick={() => deletingId && deleteMutation.mutate({ id: deletingId })}
            >
              Excluir
            </Button>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
