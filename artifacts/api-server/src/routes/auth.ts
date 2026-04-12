import { Router } from "express";

const router = Router();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@recorrente.co";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

declare module "express-session" {
  interface SessionData {
    userId: string;
    email: string;
  }
}

router.post("/auth/login", (req, res) => {
  const { email, password } = req.body as { email: string; password: string };

  if (!email || !password) {
    res.status(400).json({ error: "E-mail e senha são obrigatórios" });
    return;
  }

  if (
    email.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase() ||
    password !== ADMIN_PASSWORD
  ) {
    res.status(401).json({ error: "E-mail ou senha incorretos" });
    return;
  }

  req.session.userId = "admin";
  req.session.email = ADMIN_EMAIL;

  req.session.save((err) => {
    if (err) {
      res.status(500).json({ error: "Erro ao iniciar sessão" });
      return;
    }
    res.json({ email: ADMIN_EMAIL });
  });
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.get("/auth/me", (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }
  res.json({ email: req.session.email });
});

export default router;
