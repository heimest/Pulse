import { expect, test } from "vitest";
import { createCheckRunner } from "../src/runner.js";
import type { CheckPayload, Monitor, MonitorClient } from "../src/types.js";

test("runOnce checks each monitor and reports results", async () => {
  const monitors: Monitor[] = [
    {
      id: "m1",
      name: "Example",
      url: "https://example.com",
      intervalSeconds: 30,
    },
  ];
  const reported: Array<{ id: string; payload: CheckPayload }> = [];

  const monitorClient: MonitorClient = {
    async listMonitors() {
      return monitors;
    },
    async reportCheck(monitorId, payload) {
      reported.push({ id: monitorId, payload });
    },
  };

  const runner = createCheckRunner(
    monitorClient,
    {
      async check() {
        return {
          status: "UP",
          httpStatusCode: 200,
          responseTimeMs: 12,
          errorMessage: null,
        };
      },
    },
    { info() {}, error() {} },
  );

  const completed = await runner.runOnce();

  expect(completed).toBe(1);
  expect(reported).toEqual([
    {
      id: "m1",
      payload: {
        status: "UP",
        httpStatusCode: 200,
        responseTimeMs: 12,
        errorMessage: null,
      },
    },
  ]);
});
