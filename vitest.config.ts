import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

const templateRoot = path.resolve(import.meta.dirname);

export default defineConfig({
  plugins: [
    // Required so Vitest can transform JSX in .tsx files imported by client tests
    // (e.g. ReactivationResetButton.tsx).  Without this, vite:import-analysis
    // throws "invalid JS syntax" when encountering JSX syntax.
    react(),
  ],
  root: templateRoot,
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "client", "src"),
      "@shared": path.resolve(templateRoot, "shared"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
    },
  },
  test: {
    environment: "node",
    environmentMatchGlobs: [
      // Client hook/component tests need a browser-like DOM environment.
      // happy-dom is lighter than jsdom and sufficient for renderHook tests.
      ["client/**/*.test.ts", "happy-dom"],
    ],
    include: [
      "server/**/*.test.ts",
      "server/**/*.spec.ts",
      "client/**/*.test.ts",
    ],
  },
});
