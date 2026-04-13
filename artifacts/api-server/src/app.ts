import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pinoHttp from "pino-http";
import path from "path";
import { fileURLToPath } from "url";
import router from "./routes";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessionStore =
  process.env.NODE_ENV === "production"
    ? new (connectPgSimple(session))({ pool, createTableIfMissing: true })
    : undefined;

app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || "recorrente-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
);

app.use("/api", router);

if (process.env.NODE_ENV === "production") {
  const publicPath = path.join(__dirname, "..", "public");
  app.use(express.static(publicPath));
  app.use((_req, res) => {
    res.sendFile(path.join(publicPath, "index.html"));
  });
}

export default app;
