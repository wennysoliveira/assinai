import { useGetDashboardSummary, useGetMonthlyRevenue, useGetRecentPayments, useProcessDueSubscriptions } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowUpRight, ArrowDownRight, CreditCard, Users, Receipt, AlertCircle, RefreshCw, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface MetricCardProps {
  title: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon: React.ReactNode;
  gradient: string;
  isLoading: boolean;
}

function MetricCard({ title, value, sub, icon, gradient, isLoading }: MetricCardProps) {
  return (
    <div
      className="relative overflow-hidden rounded-xl p-5 text-white shadow-lg"
      style={{ background: gradient }}
    >
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.4) 0%, transparent 60%)"
      }} />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <p className="text-sm font-medium text-white/80">{title}</p>
          <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
            {icon}
          </div>
        </div>
        {isLoading ? (
          <Skeleton className="h-9 w-28 bg-white/30 mt-1" />
        ) : (
          <div className="text-3xl font-bold tracking-tight">{value}</div>
        )}
        {sub && !isLoading && (
          <div className="mt-2 text-xs text-white/75 flex items-center gap-1">{sub}</div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary({
    query: { queryKey: ["/api/dashboard/summary"] }
  });
  
  const { data: monthlyRevenue, isLoading: isLoadingRevenue } = useGetMonthlyRevenue({
    query: { queryKey: ["/api/dashboard/revenue"] }
  });
  
  const { data: recentPayments, isLoading: isLoadingPayments } = useGetRecentPayments({
    query: { queryKey: ["/api/dashboard/recent-payments"] }
  });

  const processSubscriptions = useProcessDueSubscriptions({
    mutation: {
      onSuccess: (data) => {
        toast({ title: "Assinaturas processadas", description: data.message });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Erro ao processar assinaturas",
          description: error.message || "Ocorreu um erro inesperado",
        });
      }
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Visão geral da sua receita recorrente e métricas.</p>
        </div>
        <Button
          onClick={() => processSubscriptions.mutate({})}
          disabled={processSubscriptions.isPending}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${processSubscriptions.isPending ? "animate-spin" : ""}`} />
          Processar Cobranças
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Receita Mensal Recorrente (MRR)"
          value={formatCurrency(summary?.mrr || 0)}
          sub={<><ArrowUpRight className="w-3.5 h-3.5" /> +4,5% em relação ao mês anterior</>}
          icon={<CreditCard className="w-5 h-5 text-white" />}
          gradient="linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)"
          isLoading={isLoadingSummary}
        />
        <MetricCard
          title="Assinaturas Ativas"
          value={summary?.activeSubscriptions || 0}
          sub={<><ArrowUpRight className="w-3.5 h-3.5" /> +12 novas este mês</>}
          icon={<Users className="w-5 h-5 text-white" />}
          gradient="linear-gradient(135deg, #059669 0%, #0891b2 100%)"
          isLoading={isLoadingSummary}
        />
        <MetricCard
          title="Taxa de Cancelamento"
          value={`${summary?.churnRate?.toFixed(1) || "0,0"}%`}
          sub={<><ArrowDownRight className="w-3.5 h-3.5" /> +0,2% em relação ao mês anterior</>}
          icon={<ArrowDownRight className="w-5 h-5 text-white" />}
          gradient="linear-gradient(135deg, #e11d48 0%, #9f1239 100%)"
          isLoading={isLoadingSummary}
        />
        <MetricCard
          title="Receita Hoje"
          value={formatCurrency(summary?.todayRevenue || 0)}
          icon={<TrendingUp className="w-5 h-5 text-white" />}
          gradient="linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)"
          isLoading={isLoadingSummary}
        />
        <MetricCard
          title="Faturas Pendentes"
          value={summary?.pendingInvoices || 0}
          icon={<Receipt className="w-5 h-5 text-white" />}
          gradient="linear-gradient(135deg, #d97706 0%, #ea580c 100%)"
          isLoading={isLoadingSummary}
        />
        <MetricCard
          title="Faturas Atrasadas"
          value={summary?.overdueInvoices || 0}
          icon={<AlertCircle className="w-5 h-5 text-white" />}
          gradient="linear-gradient(135deg, #dc2626 0%, #db2777 100%)"
          isLoading={isLoadingSummary}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <CardTitle>Visão de Receita</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-2">
            {isLoadingRevenue ? (
              <div className="h-[300px] flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyRevenue || []} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <XAxis
                      dataKey="month"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      dy={10}
                    />
                    <YAxis
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => `R$${value/1000}k`}
                      dx={-10}
                    />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted))' }}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                        boxShadow: 'var(--shadow-md)'
                      }}
                      formatter={(value: number) => [formatCurrency(value), "Receita"]}
                    />
                    <Bar
                      dataKey="revenue"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={48}
                      fill="url(#barGradient)"
                    />
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7c3aed" />
                        <stop offset="100%" stopColor="#4f46e5" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: "linear-gradient(135deg, #059669, #0891b2)" }}>
                <CreditCard className="w-4 h-4 text-white" />
              </div>
              <CardTitle>Pagamentos Recentes</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingPayments ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : recentPayments?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Nenhum pagamento recente
              </div>
            ) : (
              <div className="space-y-5">
                {recentPayments?.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs"
                        style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                      >
                        {payment.customerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none text-foreground">
                          {payment.customerName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(payment.paidAt)}
                        </p>
                      </div>
                    </div>
                    <div className="font-semibold text-sm text-success">
                      +{formatCurrency(payment.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
