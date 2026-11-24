import type { CheckPayload, HttpChecker } from "./types.js";

const DEFAULT_TIMEOUT_MS = 5_000;

export function createHttpChecker(timeoutMs = DEFAULT_TIMEOUT_MS): HttpChecker {
  return {
    async check(url: string): Promise<CheckPayload> {
      const startedAt = Date.now();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(url, {
          method: "GET",
          redirect: "follow",
          signal: controller.signal,
        });
        const responseTimeMs = Date.now() - startedAt;
        const status = response.ok ? "UP" : "DOWN";
        return {
          status,
          httpStatusCode: response.status,
          responseTimeMs,
          errorMessage: response.ok
            ? null
            : `unexpected status ${response.status}`,
        };
      } catch (error) {
        return {
          status: "DOWN",
          httpStatusCode: null,
          responseTimeMs: Date.now() - startedAt,
          errorMessage:
            error instanceof Error ? error.message : "request failed",
        };
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
