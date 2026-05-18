import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

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
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Gallaorol Yoshlar Markazi Bot</title>
  <style>
    body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f0f4f8; }
    .card { background: white; border-radius: 16px; padding: 48px 40px; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.08); max-width: 400px; }
    .icon { font-size: 64px; margin-bottom: 16px; }
    h1 { color: #1a202c; margin: 0 0 8px; font-size: 22px; }
    p { color: #718096; margin: 0 0 24px; }
    .badge { display: inline-flex; align-items: center; gap: 8px; background: #f0fff4; color: #276749; border: 1px solid #9ae6b4; border-radius: 99px; padding: 6px 16px; font-size: 14px; font-weight: 600; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: #48bb78; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
    a { display: inline-block; margin-top: 20px; color: #3182ce; text-decoration: none; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🤖</div>
    <h1>Gallaorol Yoshlar Markazi</h1>
    <p>Telegram kurs ro'yxatga olish boti</p>
    <div class="badge"><span class="dot"></span> Bot ishlamoqda</div>
    <br/>
    <a href="https://t.me/Gallaorolyoshlar" target="_blank">📢 Kanalga o'tish</a>
  </div>
</body>
</html>`);
});

app.use("/api", router);

export default app;
