import type { FastifyInstance } from "fastify";
import type { CreateCheckInput, MonitorStore } from "../domain/types.js";

interface CreateMonitorBody {
  name?: unknown;
  url?: unknown;
  intervalSeconds?: unknown;
}

interface CreateCheckBody {
  status?: unknown;
  httpStatusCode?: unknown;
  responseTimeMs?: unknown;
  errorMessage?: unknown;
}

const ALLOWED_STATUSES = new Set(["UP", "DOWN", "UNKNOWN"]);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function parseIntervalSeconds(value: unknown): number | undefined | null {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "number" || !Number.isInteger(value) || value < 5) {
    return null;
  }
  return value;
}

export function registerMonitorRoutes(
  app: FastifyInstance,
  store: MonitorStore,
): void {
  app.get("/monitors", async () => store.listMonitors());

  app.post<{ Body: CreateMonitorBody }>("/monitors", async (request, reply) => {
    const { name, url, intervalSeconds } = request.body ?? {};
    const parsedInterval = parseIntervalSeconds(intervalSeconds);

    if (!isNonEmptyString(name) || !isNonEmptyString(url) || !isValidUrl(url)) {
      return reply.code(400).send({
        error: "name and a valid http(s) url are required",
      });
    }
    if (parsedInterval === null) {
      return reply.code(400).send({
        error: "intervalSeconds must be an integer greater than or equal to 5",
      });
    }

    const monitor = await store.createMonitor({
      name: name.trim(),
      url: url.trim(),
      intervalSeconds: parsedInterval,
    });
    return reply.code(201).send(monitor);
  });

  app.get<{ Params: { id: string } }>(
    "/monitors/:id",
    async (request, reply) => {
      const monitor = await store.getMonitor(request.params.id);
      if (!monitor) {
        return reply.code(404).send({ error: "monitor not found" });
      }
      return monitor;
    },
  );

  app.delete<{ Params: { id: string } }>(
    "/monitors/:id",
    async (request, reply) => {
      const deleted = await store.deleteMonitor(request.params.id);
      if (!deleted) {
        return reply.code(404).send({ error: "monitor not found" });
      }
      return reply.code(204).send();
    },
  );

  app.get<{ Params: { id: string } }>(
    "/monitors/:id/checks",
    async (request, reply) => {
      const monitor = await store.getMonitor(request.params.id);
      if (!monitor) {
        return reply.code(404).send({ error: "monitor not found" });
      }
      return store.listChecks(request.params.id);
    },
  );

  app.post<{ Params: { id: string }; Body: CreateCheckBody }>(
    "/monitors/:id/checks",
    async (request, reply) => {
      const body = request.body ?? {};
      if (
        typeof body.status !== "string" ||
        !ALLOWED_STATUSES.has(body.status)
      ) {
        return reply.code(400).send({
          error: "status must be one of UP, DOWN, UNKNOWN",
        });
      }

      const input: CreateCheckInput = {
        status: body.status as CreateCheckInput["status"],
        httpStatusCode:
          typeof body.httpStatusCode === "number" ? body.httpStatusCode : null,
        responseTimeMs:
          typeof body.responseTimeMs === "number" ? body.responseTimeMs : null,
        errorMessage:
          typeof body.errorMessage === "string" ? body.errorMessage : null,
      };

      const check = await store.addCheck(request.params.id, input);
      if (!check) {
        return reply.code(404).send({ error: "monitor not found" });
      }
      return reply.code(201).send(check);
    },
  );
}
