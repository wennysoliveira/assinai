import { Router, type IRouter } from "express";
import { eq, sql, and, gte, lte } from "drizzle-orm";
import { db, subscriptionsTable, invoicesTable, customersTable } from "@workspace/db";
import {
  GetDashboardSummaryResponse,
  GetRecentPaymentsResponse,
  GetMonthlyRevenueResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const activeSubscriptions = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.status, "active"));

  const allMonthlyAmount = await db
    .select({
      total: sql<string>`coalesce(sum(case when periodicity = 'monthly' then amount else amount / 12 end), 0)`,
    })
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.status, "active"));

  const mrr = Number(allMonthlyAmount[0]?.total || 0);

  const cancelledLastMonth = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(subscriptionsTable)
    .where(
      and(
        eq(subscriptionsTable.status, "cancelled"),
        gte(subscriptionsTable.updatedAt, sql`now() - interval '30 days'`)
      )
    );

  const totalSubs = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(subscriptionsTable);

  const churnRate = totalSubs[0]?.count > 0
    ? (cancelledLastMonth[0]?.count / totalSubs[0]?.count) * 100
    : 0;

  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  const todayPayments = await db
    .select({
      total: sql<string>`coalesce(sum(amount), 0)`,
    })
    .from(invoicesTable)
    .where(
      and(
        eq(invoicesTable.status, "paid"),
        gte(invoicesTable.paidAt, startOfDay),
        lte(invoicesTable.paidAt, endOfDay)
      )
    );

  const pendingInvoices = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(invoicesTable)
    .where(eq(invoicesTable.status, "pending"));

  const overdueInvoices = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(invoicesTable)
    .where(eq(invoicesTable.status, "overdue"));

  res.json(GetDashboardSummaryResponse.parse({
    mrr: Number(mrr),
    activeSubscriptions: activeSubscriptions[0]?.count || 0,
    churnRate: Number(churnRate.toFixed(1)),
    todayRevenue: Number(todayPayments[0]?.total || 0),
    pendingInvoices: pendingInvoices[0]?.count || 0,
    overdueInvoices: overdueInvoices[0]?.count || 0,
  }));
});

router.get("/dashboard/recent-payments", async (_req, res): Promise<void> => {
  const payments = await db
    .select({
      id: invoicesTable.id,
      customerName: customersTable.name,
      amount: invoicesTable.amount,
      paidAt: invoicesTable.paidAt,
    })
    .from(invoicesTable)
    .leftJoin(customersTable, eq(invoicesTable.customerId, customersTable.id))
    .where(eq(invoicesTable.status, "paid"))
    .orderBy(sql`${invoicesTable.paidAt} desc nulls last`)
    .limit(10);

  const mapped = payments
    .filter(p => p.paidAt !== null)
    .map(p => ({
      id: p.id,
      customerName: p.customerName || "Unknown",
      amount: Number(p.amount),
      paidAt: p.paidAt!,
    }));

  res.json(GetRecentPaymentsResponse.parse(mapped));
});

router.get("/dashboard/monthly-revenue", async (_req, res): Promise<void> => {
  const results = await db.execute(sql`
    SELECT
      to_char(date_trunc('month', paid_at), 'YYYY-MM') as month,
      coalesce(sum(amount), 0)::numeric as revenue
    FROM invoices
    WHERE status = 'paid' AND paid_at IS NOT NULL
    GROUP BY date_trunc('month', paid_at)
    ORDER BY month DESC
    LIMIT 12
  `);

  const data = (results.rows as Array<{ month: string; revenue: string }>).map(r => ({
    month: r.month,
    revenue: Number(r.revenue),
  })).reverse();

  res.json(GetMonthlyRevenueResponse.parse(data));
});

export default router;
