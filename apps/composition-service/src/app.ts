import Fastify from "fastify";
import mercurius from "mercurius";
import { createMonitorApi } from "./monitor-api.js";
import { createResolvers } from "./resolvers.js";
import { typeDefs } from "./schema.js";

export interface BuildAppOptions {
  monitorServiceUrl?: string;
}

export function buildApp(options: BuildAppOptions = {}) {
  const monitorServiceUrl =
    options.monitorServiceUrl ??
    process.env.MONITOR_SERVICE_URL ??
    "http://127.0.0.1:3000";
  const api = createMonitorApi(monitorServiceUrl);
  const app = Fastify({ logger: true });

  app.get("/health", async () => ({ status: "ok" }));
  app.get("/health/live", async () => ({ status: "ok" }));
  app.get("/health/ready", async () => ({ status: "ok" }));

  app.register(mercurius, {
    schema: typeDefs,
    resolvers: createResolvers(api),
    graphiql: true,
    path: "/graphql",
  });

  return app;
}
