import type { FastifyInstance } from "fastify";
import type { MonitorStore } from "../domain/types.js";
import type { CheckGrpcClient } from "../grpc/check-client.js";
import { runCreateMonitorSaga } from "../saga/create-monitor-saga.js";

interface CreateMonitorBody {
  name?: unknown;
  url?: unknown;
  intervalSeconds?: unknown;
}

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

export function registerSagaRoutes(
  app: FastifyInstance,
  store: MonitorStore,
  checker: CheckGrpcClient,
): void {
  app.post<{ Body: CreateMonitorBody }>(
    "/monitors/saga",
    async (request, reply) => {
      const { name, url, intervalSeconds } = request.body ?? {};
      const parsedInterval = parseIntervalSeconds(intervalSeconds);

      if (
        !isNonEmptyString(name) ||
        !isNonEmptyString(url) ||
        !isValidUrl(url)
      ) {
        return reply.code(400).send({
          error: "name and a valid http(s) url are required",
        });
      }
      if (parsedInterval === null) {
        return reply.code(400).send({
          error:
            "intervalSeconds must be an integer greater than or equal to 5",
        });
      }

      try {
        const outcome = await runCreateMonitorSaga(store, checker, {
          name: name.trim(),
          url: url.trim(),
          intervalSeconds: parsedInterval,
        });

        if (outcome.status === "compensated") {
          return reply.code(409).send(outcome);
        }
        return reply.code(201).send(outcome);
      } catch (error) {
        request.log.error({ err: error }, "monitor saga failed");
        return reply.code(502).send({
          error: "saga failed while contacting the checker service",
          detail: error instanceof Error ? error.message : "unknown error",
        });
      }
    },
  );
}
