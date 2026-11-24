import Fastify from "fastify";
import type { CheckRunner } from "./runner.js";

export interface CheckerDependencies {
  runner?: CheckRunner;
}

export function buildApp(deps: CheckerDependencies = {}) {
  const app = Fastify({ logger: true });

  app.get("/health", async () => ({ status: "ok" }));
  app.get("/health/live", async () => ({ status: "ok" }));
  app.get("/health/ready", async () => ({ status: "ok" }));

  app.post("/checks/run", async (_request, reply) => {
    if (!deps.runner) {
      return reply
        .code(503)
        .send({ error: "checker runner is not configured" });
    }
    const completed = await deps.runner.runOnce();
    return { completed };
  });

  return app;
}
