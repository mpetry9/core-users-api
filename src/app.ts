import express, { Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import geoip from "geoip-lite";
import { UAParser } from "ua-parser-js";
import usersRoutes from "./routes/users.routes";
import authRoutes from "./routes/auth.routes";
import apiKeysRoutes from "./routes/apiKeys.routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { authConfig } from "./config/auth";

const app = express();

// ============================================
// Security Middleware
// ============================================

// Helmet - Security headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable CSP for API
    crossOriginEmbedderPolicy: false,
  }),
);

// CORS - Cross-Origin Resource Sharing
app.use(
  cors({
    origin: authConfig.cors.origins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Rate limiting for authentication endpoints
const authRateLimiter = rateLimit({
  windowMs: authConfig.rateLimit.windowMs,
  max: authConfig.rateLimit.maxRequests,
  message: {
    error: "Too many requests",
    message: "Too many authentication attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================
// Body Parser
// ============================================

app.use(express.json());

// ============================================
// Public Routes (no authentication required)
// ============================================

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

// ============================================
// Authentication Routes (rate limited)
// ============================================

app.use("/auth", authRateLimiter, authRoutes);

// ============================================
// Protected API Routes
// ============================================

app.use("/api/users", usersRoutes);
app.use("/api/keys", apiKeysRoutes);

// ============================================
// Error Handlers (must be last)
// ============================================

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
