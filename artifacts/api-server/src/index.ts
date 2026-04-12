import app from "./app";
import { logger } from "./lib/logger";
import cron from "node-cron";
import { processDueSubscriptions } from "./routes/billing";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});

cron.schedule("0 8 * * *", async () => {
  logger.info("Running scheduled billing job (daily 08:00)");
  try {
    const result = await processDueSubscriptions();
    logger.info(result, "Scheduled billing job completed");
  } catch (err) {
    logger.error({ err }, "Scheduled billing job failed");
  }
}, {
  timezone: "America/Sao_Paulo",
});

logger.info("Cron job scheduled: daily billing at 08:00 (America/Sao_Paulo)");
