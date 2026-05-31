import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(
    express.static(staticPath, {
      setHeaders(res, filePath) {
        if (filePath.endsWith("index.html")) {
          // index.html must always be re-validated so the browser picks up
          // new hashed asset filenames after a deployment.
          res.setHeader("Cache-Control", "no-cache");
        } else if (/\/assets\//.test(filePath)) {
          // Vite fingerprints every file in /assets/ with a content hash, so
          // they are immutable — safe to cache for one year.
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else {
          // Everything else (manifest.json, robots.txt, favicon, sitemap …):
          // cache for one hour, then re-validate.
          res.setHeader("Cache-Control", "public, max-age=3600");
        }
      },
    })
  );

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
