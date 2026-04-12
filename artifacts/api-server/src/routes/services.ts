import { Router, type IRouter } from "express";
import { eq, ilike, and } from "drizzle-orm";
import { db, servicesTable } from "@workspace/db";
import {
  ListServicesQueryParams,
  ListServicesResponse,
  CreateServiceBody,
  GetServiceParams,
  GetServiceResponse,
  UpdateServiceParams,
  UpdateServiceBody,
  UpdateServiceResponse,
  DeleteServiceParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/services", async (req, res): Promise<void> => {
  const query = ListServicesQueryParams.safeParse(req.query);
  const conditions = [];

  if (query.success && query.data.search) {
    conditions.push(ilike(servicesTable.name, `%${query.data.search}%`));
  }
  if (query.success && query.data.active !== undefined) {
    conditions.push(eq(servicesTable.active, query.data.active));
  }

  const services = await db
    .select()
    .from(servicesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(servicesTable.name);

  res.json(ListServicesResponse.parse(services));
});

router.post("/services", async (req, res): Promise<void> => {
  const parsed = CreateServiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [service] = await db.insert(servicesTable).values(parsed.data).returning();
  res.status(201).json(GetServiceResponse.parse(service));
});

router.get("/services/:id", async (req, res): Promise<void> => {
  const params = GetServiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [service] = await db
    .select()
    .from(servicesTable)
    .where(eq(servicesTable.id, params.data.id));

  if (!service) {
    res.status(404).json({ error: "Service not found" });
    return;
  }

  res.json(GetServiceResponse.parse(service));
});

router.patch("/services/:id", async (req, res): Promise<void> => {
  const params = UpdateServiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateServiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [service] = await db
    .update(servicesTable)
    .set(parsed.data)
    .where(eq(servicesTable.id, params.data.id))
    .returning();

  if (!service) {
    res.status(404).json({ error: "Service not found" });
    return;
  }

  res.json(UpdateServiceResponse.parse(service));
});

router.delete("/services/:id", async (req, res): Promise<void> => {
  const params = DeleteServiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [service] = await db
    .delete(servicesTable)
    .where(eq(servicesTable.id, params.data.id))
    .returning();

  if (!service) {
    res.status(404).json({ error: "Service not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
