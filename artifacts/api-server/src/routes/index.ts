import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import healthRouter from "./health";
import authRouter from "./auth";
import servicesRouter from "./services";
import customersRouter from "./customers";
import subscriptionsRouter from "./subscriptions";
import invoicesRouter from "./invoices";
import dashboardRouter from "./dashboard";
import billingRouter from "./billing";
import webhooksRouter from "./webhooks";
import whatsappRouter from "./whatsapp";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);

router.use(requireAuth);

router.use(servicesRouter);
router.use(customersRouter);
router.use(subscriptionsRouter);
router.use(invoicesRouter);
router.use(dashboardRouter);
router.use(billingRouter);
router.use(webhooksRouter);
router.use(whatsappRouter);

export default router;
