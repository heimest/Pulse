import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";

let app: FastifyInstance;

beforeEach(async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/monitors")) {
        return new Response(
          JSON.stringify([
            {
              id: "m1",
              name: "Example",
              url: "https://example.com",
              intervalSeconds: 30,
              createdAt: "2026-01-01T00:00:00.000Z",
            },
          ]),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      if (url.endsWith("/monitors/m1/checks")) {
        return new Response(
          JSON.stringify([
            {
              id: "c1",
              monitorId: "m1",
              status: "UP",
              httpStatusCode: 200,
              responseTimeMs: 42,
              checkedAt: "2026-01-01T00:01:00.000Z",
              errorMessage: null,
            },
          ]),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      return new Response("not found", { status: 404 });
    }),
  );

  app = buildApp({ monitorServiceUrl: "http://monitor.test" });
  await app.ready();
});

afterEach(async () => {
  vi.unstubAllGlobals();
  await app.close();
});

test("GraphQL monitors query composes monitors and latest checks", async () => {
  const response = await app.inject({
    method: "POST",
    url: "/graphql",
    payload: {
      query: `{
        monitors {
          id
          name
          latestCheck { status responseTimeMs }
        }
      }`,
    },
  });

  expect(response.statusCode).toBe(200);
  expect(response.json()).toEqual({
    data: {
      monitors: [
        {
          id: "m1",
          name: "Example",
          latestCheck: { status: "UP", responseTimeMs: 42 },
        },
      ],
    },
  });
});
