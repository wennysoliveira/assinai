import { useGetDashboardSummary, useGetMonthlyRevenue, useGetRecentPayments, useProcessDueSubscriptions } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowUpRight, ArrowDownRight, CreditCard, Users, Receipt, AlertCircle, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

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
        toast({
          title: "Subscriptions processed",
          description: data.message,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Error processing subscriptions",
          description: error.message || "An unexpected error occurred",
        });
      }
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your recurring revenue and metrics.</p>
        </div>
        <Button 
          onClick={() => processSubscriptions.mutate({})} 
          disabled={processSubscriptions.isPending}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${processSubscriptions.isPending ? "animate-spin" : ""}`} />
          Process Due Subscriptions
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="hover-elevate transition-all border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Recurring Revenue (MRR)</CardTitle>
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-8 w-32 mt-1" />
            ) : (
              <>
                <div className="text-3xl font-bold">{formatCurrency(summary?.mrr || 0)}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-2">
                  <span className="flex items-center text-success font-medium mr-2">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    +4.5%
                  </span>
                  from last month
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover-elevate transition-all border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Subscriptions</CardTitle>
            <div className="w-8 h-8 rounded bg-success/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-8 w-24 mt-1" />
            ) : (
              <>
                <div className="text-3xl font-bold">{summary?.activeSubscriptions || 0}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-2">
                  <span className="flex items-center text-success font-medium mr-2">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    +12
                  </span>
                  new this month
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover-elevate transition-all border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Churn Rate</CardTitle>
            <div className="w-8 h-8 rounded bg-destructive/10 flex items-center justify-center">
              <ArrowDownRight className="h-4 w-4 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-8 w-24 mt-1" />
            ) : (
              <>
                <div className="text-3xl font-bold">{summary?.churnRate?.toFixed(1) || "0.0"}%</div>
                <div className="flex items-center text-xs text-muted-foreground mt-2">
                  <span className="flex items-center text-destructive font-medium mr-2">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    +0.2%
                  </span>
                  from last month
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover-elevate transition-all border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Revenue</CardTitle>
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-8 w-32 mt-1" />
            ) : (
              <div className="text-3xl font-bold text-primary">{formatCurrency(summary?.todayRevenue || 0)}</div>
            )}
          </CardContent>
        </Card>

        <Card className="hover-elevate transition-all border-border shadow-sm bg-warning/5 border-warning/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-warning-foreground">Pending Invoices</CardTitle>
            <div className="w-8 h-8 rounded bg-warning/20 flex items-center justify-center">
              <Receipt className="h-4 w-4 text-warning-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-8 w-24 mt-1" />
            ) : (
              <div className="text-3xl font-bold text-warning-foreground">{summary?.pendingInvoices || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="hover-elevate transition-all border-border shadow-sm bg-destructive/5 border-destructive/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Overdue Invoices</CardTitle>
            <div className="w-8 h-8 rounded bg-destructive/20 flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-8 w-24 mt-1" />
            ) : (
              <div className="text-3xl font-bold text-destructive">{summary?.overdueInvoices || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <Card className="lg:col-span-2 shadow-sm border-border">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
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
                      formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                    />
                    <Bar 
                      dataKey="revenue" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]} 
                      maxBarSize={50}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
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
                No recent payments
              </div>
            ) : (
              <div className="space-y-6">
                {recentPayments?.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs">
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
                    <div className="font-medium text-sm text-success">
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
