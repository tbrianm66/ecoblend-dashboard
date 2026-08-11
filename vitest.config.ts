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
    // Use the threads pool: large client test suites (gate4Config.test.ts loads
    // Sidebar + the full gate4 module graph) exhaust the default 2 GB heap in
    // the forks pool's child processes.  The threads pool keeps all workers in
    // the same process heap and is well within the available 4–8 GB.
    pool: "threads",
    environment: "node",
    environmentMatchGlobs: [
      // Client hook/component tests need a browser-like DOM environment.
      // happy-dom is lighter than jsdom and sufficient for renderHook tests.
      ["client/**/*.test.ts", "happy-dom"],
      ["client/**/*.test.tsx", "happy-dom"],
    ],
    include: [
      "server/**/*.test.ts",
      "server/**/*.spec.ts",
      "client/**/*.test.ts",
      "client/**/*.test.tsx",
    ],
  },
});
