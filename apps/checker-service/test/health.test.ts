import { afterEach, beforeEach, expect, test } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";

let app: FastifyInstance;

beforeEach(() => {
  app = buildApp();
});

afterEach(async () => {
  await app.close();
});

test("GET /health returns the service status as JSON", async () => {
  const response = await app.inject({ method: "GET", url: "/health" });

  expect(response.statusCode).toBe(200);
  expect(response.headers["content-type"]).toMatch(/^application\/json\b/);
  expect(response.json()).toEqual({ status: "ok" });
});
