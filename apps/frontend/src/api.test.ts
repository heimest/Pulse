import { expect, test } from "vitest";
import { fetchMonitors } from "./api";

test("fetchMonitors reads GraphQL monitor composition", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        data: {
          monitors: [
            {
              id: "m1",
              name: "Example",
              url: "https://example.com",
              intervalSeconds: 30,
              latestCheck: {
                status: "UP",
                responseTimeMs: 10,
                checkedAt: "2026-01-01T00:00:00.000Z",
              },
            },
          ],
        },
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );

  try {
    const monitors = await fetchMonitors();
    expect(monitors).toHaveLength(1);
    expect(monitors[0]?.latestCheck?.status).toBe("UP");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
