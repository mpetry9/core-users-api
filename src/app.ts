import express, { Request, Response } from "express";
import geoip from "geoip-lite";
import { UAParser } from "ua-parser-js";

const app = express();

app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "Welcome to core-users-api" });
});

app.get("/health", (req: Request, res: Response) => {
  const forwarded = req.headers["x-forwarded-for"];
  const ip =
    (Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded?.split(",")[0].trim()) ??
    req.socket.remoteAddress ??
    "unknown";

  const geo = geoip.lookup(ip);

  const ua = new UAParser(req.headers["user-agent"] ?? "");
  const browser = ua.getBrowser();
  const os = ua.getOS();

  const acceptLanguage = req.headers["accept-language"] ?? "";
  const primaryLanguage =
    acceptLanguage.split(",")[0].split(";")[0].trim() || "unknown";

  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    client: {
      ip,
      country: geo?.country ?? "unknown",
      language: primaryLanguage,
      os: [os.name, os.version].filter(Boolean).join(" ") || "unknown",
      browser:
        [browser.name, browser.version].filter(Boolean).join(" ") || "unknown",
    },
  });
});

export default app;
