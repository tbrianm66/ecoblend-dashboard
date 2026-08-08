import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { handleSSEConnection, type SSEUserContext } from "../sse";
import { sdk } from "./sdk";
import { getDb } from "../db";
import { ventureMembers } from "../../drizzle/schema";
import { seedProductionIfEmpty } from "../seedProduction";
import { eq } from "drizzle-orm";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

// Build CSP once at startup so the string isn't rebuilt on every request.
const analyticsOrigin = (() => {
  try {
    return process.env.VITE_ANALYTICS_ENDPOINT
      ? new URL(process.env.VITE_ANALYTICS_ENDPOINT).origin
      : null;
  } catch {
    return null;
  }
})();

// In development, Vite's @vitejs/plugin-react injects an inline preamble script
// (and HMR uses inline scripts). Without 'unsafe-inline' the browser blocks it,
// React Refresh never installs, and the app crashes with "can't detect preamble".
// Production serves a static bundle with no inline scripts, so it keeps the strict policy.
const isProduction = process.env.NODE_ENV === "production";

const scriptSrc = [
  "'self'",
  isProduction ? null : "'unsafe-inline'", // dev-only: allow Vite preamble/HMR inline scripts
  "https://forge.butterfly-effect.dev", // Maps proxy script + API calls
  "https://maps.googleapis.com",         // Google Maps JS API (loaded via forge proxy)
  analyticsOrigin,                        // Umami analytics (if VITE_ANALYTICS_ENDPOINT is set)
].filter(Boolean).join(" ");

const CSP = [
  "default-src 'self'",
  `script-src ${scriptSrc}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "manifest-src 'self'",
  "img-src 'self' data: blob: https://d2xsxph8kpxj0f.cloudfront.net https://maps.googleapis.com https://maps.gstatic.com",
  "connect-src 'self' https://forge.butterfly-effect.dev https://www.ecoblend.io https://ecoblend.io",
  "worker-src blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

async function startServer() {
  const app = express();
  const server = createServer(app);

  // ── Deployment health check — must be first, before all other middleware ──
  // Cloud Run (and any load-balancer/orchestrator) probes this path to decide
  // whether the instance is ready to receive traffic.  It must:
  //   • return HTTP 200 unconditionally (no auth, no DB, no static files)
  //   • not block on any asynchronous work
  //   • not expose application data
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Security headers — applied to every response before any route handler
  app.use((_req, res, next) => {
    res.setHeader("Content-Security-Policy", CSP);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(self), payment=()");
    next();
  });
  // Tell crawlers not to index API responses
  app.use("/api", (_req, res, next) => {
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    next();
  });
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // SSE endpoint for real-time event streaming (public — unauthenticated gets anonymous context)
  app.get("/api/events", async (req, res, _next) => {
    let user: Awaited<ReturnType<typeof sdk.authenticateRequest>> | null = null;
    try {
      user = await sdk.authenticateRequest(req);
    } catch {
      // No valid session — allow connection as anonymous observer
    }

    let isAdmin = false;
    let authorizedVentureIds: Set<string> | null = null;

    if (user) {
      isAdmin = user.role === "admin";
      if (!isAdmin) {
        try {
          const db = (await getDb())!;
          const memberships = await db
            .select({ ventureId: ventureMembers.ventureId })
            .from(ventureMembers)
            .where(eq(ventureMembers.userId, user.id));
          authorizedVentureIds = new Set(memberships.map((m) => m.ventureId));
        } catch {
          authorizedVentureIds = new Set(); // deny-safe fallback
        }
      }
    }

    const userCtx: SSEUserContext = {
      userId: user ? String(user.id) : "anonymous",
      isAdmin,
      // null = broadcast all events (anonymous observers see portfolio-wide stream)
      authorizedVentureIds: user ? authorizedVentureIds : null,
    };
    handleSSEConnection(req, res, userCtx);
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Seed production DB if empty (no-op when data already exists)
  await seedProductionIfEmpty();

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
