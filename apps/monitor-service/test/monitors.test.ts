import { afterEach, beforeEach, expect, test } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import { createMemoryStore } from "../src/store/memory.js";

let app: FastifyInstance;

beforeEach(() => {
  app = buildApp({ store: createMemoryStore() });
});

afterEach(async () => {
  await app.close();
});

test("POST /monitors creates a monitor and lists it", async () => {
  const created = await app.inject({
    method: "POST",
    url: "/monitors",
    payload: {
      name: "Example",
      url: "https://example.com",
      intervalSeconds: 30,
    },
  });

  expect(created.statusCode).toBe(201);
  const monitor = created.json();
  expect(monitor).toMatchObject({
    name: "Example",
    url: "https://example.com",
    intervalSeconds: 30,
  });
  expect(monitor.id).toBeTruthy();

  const listed = await app.inject({ method: "GET", url: "/monitors" });
  expect(listed.statusCode).toBe(200);
  expect(listed.json()).toEqual([monitor]);

  const detail = await app.inject({
    method: "GET",
    url: `/monitors/${monitor.id}`,
  });
  expect(detail.statusCode).toBe(200);
  expect(detail.json()).toEqual(monitor);
});

test("POST /monitors rejects invalid payloads", async () => {
  const response = await app.inject({
    method: "POST",
    url: "/monitors",
    payload: { name: "bad", url: "not-a-url" },
  });

  expect(response.statusCode).toBe(400);
});

test("DELETE /monitors/:id removes a monitor", async () => {
  const created = await app.inject({
    method: "POST",
    url: "/monitors",
    payload: { name: "Temporary", url: "https://example.org" },
  });
  const monitor = created.json();

  const deleted = await app.inject({
    method: "DELETE",
    url: `/monitors/${monitor.id}`,
  });
  expect(deleted.statusCode).toBe(204);

  const missing = await app.inject({
    method: "GET",
    url: `/monitors/${monitor.id}`,
  });
  expect(missing.statusCode).toBe(404);
});

test("POST /monitors/:id/checks records check history", async () => {
  const created = await app.inject({
    method: "POST",
    url: "/monitors",
    payload: { name: "Checked", url: "https://example.net" },
  });
  const monitor = created.json();

  const checkResponse = await app.inject({
    method: "POST",
    url: `/monitors/${monitor.id}/checks`,
    payload: {
      status: "UP",
      httpStatusCode: 200,
      responseTimeMs: 42,
    },
  });

  expect(checkResponse.statusCode).toBe(201);
  const check = checkResponse.json();
  expect(check).toMatchObject({
    monitorId: monitor.id,
    status: "UP",
    httpStatusCode: 200,
    responseTimeMs: 42,
  });

  const history = await app.inject({
    method: "GET",
    url: `/monitors/${monitor.id}/checks`,
  });
  expect(history.statusCode).toBe(200);
  expect(history.json()).toEqual([check]);
});
