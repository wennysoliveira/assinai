import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, subscriptionsTable, customersTable } from "@workspace/db";
import {
  ListSubscriptionsQueryParams,
  ListSubscriptionsResponse,
  CreateSubscriptionBody,
  GetSubscriptionParams,
  GetSubscriptionResponse,
  UpdateSubscriptionParams,
  UpdateSubscriptionBody,
  UpdateSubscriptionResponse,
  DeleteSubscriptionParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/subscriptions", async (req, res): Promise<void> => {
  const query = ListSubscriptionsQueryParams.safeParse(req.query);
  const conditions = [];

  if (query.success && query.data.customerId) {
    conditions.push(eq(subscriptionsTable.customerId, query.data.customerId));
  }
  if (query.success && query.data.status) {
    conditions.push(eq(subscriptionsTable.status, query.data.status));
  }

  const results = await db
    .select({
      id: subscriptionsTable.id,
      customerId: subscriptionsTable.customerId,
      customerName: customersTable.name,
      plan: subscriptionsTable.plan,
      periodicity: subscriptionsTable.periodicity,
      amount: subscriptionsTable.amount,
      status: subscriptionsTable.status,
      nextBillingDate: subscriptionsTable.nextBillingDate,
      createdAt: subscriptionsTable.createdAt,
      updatedAt: subscriptionsTable.updatedAt,
    })
    .from(subscriptionsTable)
    .leftJoin(customersTable, eq(subscriptionsTable.customerId, customersTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(subscriptionsTable.nextBillingDate);

  const mapped = results.map(r => ({
    ...r,
    amount: Number(r.amount),
    customerName: r.customerName || "Unknown",
  }));

  res.json(ListSubscriptionsResponse.parse(mapped));
});

router.post("/subscriptions", async (req, res): Promise<void> => {
  const parsed = CreateSubscriptionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [customer] = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.id, parsed.data.customerId));

  if (!customer) {
    res.status(400).json({ error: "Customer not found" });
    return;
  }

  const [subscription] = await db
    .insert(subscriptionsTable)
    .values({
      ...parsed.data,
      amount: String(parsed.data.amount),
    })
    .returning();

  const result = {
    ...subscription,
    amount: Number(subscription.amount),
    customerName: customer.name,
  };

  res.status(201).json(GetSubscriptionResponse.parse(result));
});

router.get("/subscriptions/:id", async (req, res): Promise<void> => {
  const params = GetSubscriptionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [result] = await db
    .select({
      id: subscriptionsTable.id,
      customerId: subscriptionsTable.customerId,
      customerName: customersTable.name,
      plan: subscriptionsTable.plan,
      periodicity: subscriptionsTable.periodicity,
      amount: subscriptionsTable.amount,
      status: subscriptionsTable.status,
      nextBillingDate: subscriptionsTable.nextBillingDate,
      createdAt: subscriptionsTable.createdAt,
      updatedAt: subscriptionsTable.updatedAt,
    })
    .from(subscriptionsTable)
    .leftJoin(customersTable, eq(subscriptionsTable.customerId, customersTable.id))
    .where(eq(subscriptionsTable.id, params.data.id));

  if (!result) {
    res.status(404).json({ error: "Subscription not found" });
    return;
  }

  res.json(GetSubscriptionResponse.parse({
    ...result,
    amount: Number(result.amount),
    customerName: result.customerName || "Unknown",
  }));
});

router.patch("/subscriptions/:id", async (req, res): Promise<void> => {
  const params = UpdateSubscriptionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateSubscriptionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.amount !== undefined) {
    updateData.amount = String(parsed.data.amount);
  }

  const [subscription] = await db
    .update(subscriptionsTable)
    .set(updateData)
    .where(eq(subscriptionsTable.id, params.data.id))
    .returning();

  if (!subscription) {
    res.status(404).json({ error: "Subscription not found" });
    return;
  }

  const [customer] = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.id, subscription.customerId));

  res.json(UpdateSubscriptionResponse.parse({
    ...subscription,
    amount: Number(subscription.amount),
    customerName: customer?.name || "Unknown",
  }));
});

router.delete("/subscriptions/:id", async (req, res): Promise<void> => {
  const params = DeleteSubscriptionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [subscription] = await db
    .update(subscriptionsTable)
    .set({ status: "cancelled" })
    .where(eq(subscriptionsTable.id, params.data.id))
    .returning();

  if (!subscription) {
    res.status(404).json({ error: "Subscription not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
