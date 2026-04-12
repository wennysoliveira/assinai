import { Router, type IRouter } from "express";
import healthRouter from "./health";
import customersRouter from "./customers";
import subscriptionsRouter from "./subscriptions";
import invoicesRouter from "./invoices";
import dashboardRouter from "./dashboard";
import billingRouter from "./billing";
import webhooksRouter from "./webhooks";

const router: IRouter = Router();

router.use(healthRouter);
router.use(customersRouter);
router.use(subscriptionsRouter);
router.use(invoicesRouter);
router.use(dashboardRouter);
router.use(billingRouter);
router.use(webhooksRouter);

export default router;
