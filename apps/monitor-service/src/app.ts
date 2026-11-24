import Fastify from "fastify";
import type { MonitorStore } from "./domain/types.js";
import { registerMonitorRoutes } from "./routes/monitors.js";
import { createMemoryStore } from "./store/memory.js";

export interface BuildAppOptions {
  store?: MonitorStore;
}

export function buildApp(options: BuildAppOptions = {}) {
  const store = options.store ?? createMemoryStore();
  const app = Fastify({ logger: true });

  app.get("/health", async () => ({ status: "ok" }));

  app.get("/health/live", async () => ({ status: "ok" }));

  app.get("/health/ready", async (_request, reply) => {
    try {
      const isReady = await store.ready();
      if (!isReady) {
        return reply.code(503).send({ status: "not_ready" });
      }
      return { status: "ok" };
    } catch {
      return reply.code(503).send({ status: "not_ready" });
    }
  });

  registerMonitorRoutes(app, store);

  app.addHook("onClose", async () => {
    await store.close();
  });

  return app;
}
