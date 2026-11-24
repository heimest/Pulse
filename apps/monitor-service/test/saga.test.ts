import { afterEach, expect, test } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import type { CheckGrpcClient } from "../src/grpc/check-client.js";
import { createMemoryStore } from "../src/store/memory.js";

let app: FastifyInstance;

function createFakeChecker(status: "UP" | "DOWN"): CheckGrpcClient {
  return {
    async checkOnce({ monitorId }) {
      return {
        monitorId,
        status,
        httpStatusCode: status === "UP" ? 200 : null,
        responseTimeMs: 12,
        errorMessage: status === "UP" ? null : "connection refused",
      };
    },
    close() {},
  };
}

afterEach(async () => {
  await app.close();
});

test("POST /monitors/saga completes when the first check is UP", async () => {
  app = buildApp({
    store: createMemoryStore(),
    checker: createFakeChecker("UP"),
  });

  const response = await app.inject({
    method: "POST",
    url: "/monitors/saga",
    payload: {
      name: "Example",
      url: "https://example.com",
      intervalSeconds: 30,
    },
  });

  expect(response.statusCode).toBe(201);
  const body = response.json();
  expect(body.status).toBe("completed");
  expect(body.monitor.url).toBe("https://example.com");
  expect(body.check.status).toBe("UP");

  const listed = await app.inject({ method: "GET", url: "/monitors" });
  expect(listed.json()).toHaveLength(1);
});

test("POST /monitors/saga compensates when the first check is DOWN", async () => {
  app = buildApp({
    store: createMemoryStore(),
    checker: createFakeChecker("DOWN"),
  });

  const response = await app.inject({
    method: "POST",
    url: "/monitors/saga",
    payload: {
      name: "Broken",
      url: "https://example.invalid",
      intervalSeconds: 30,
    },
  });

  expect(response.statusCode).toBe(409);
  const body = response.json();
  expect(body.status).toBe("compensated");
  expect(body.compensation).toBe("monitor_deleted");

  const listed = await app.inject({ method: "GET", url: "/monitors" });
  expect(listed.json()).toHaveLength(0);
});
