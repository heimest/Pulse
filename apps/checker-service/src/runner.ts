import type { HttpChecker, MonitorClient } from "./types.js";

export interface CheckRunner {
  runOnce(): Promise<number>;
  start(intervalMs: number): void;
  stop(): void;
}

type RunnerLog = {
  info: (obj: unknown, msg?: string) => void;
  error: (obj: unknown, msg?: string) => void;
};

export function createCheckRunner(
  monitorClient: MonitorClient,
  httpChecker: HttpChecker,
  log: RunnerLog,
): CheckRunner {
  let timer: NodeJS.Timeout | undefined;

  async function runOnce(): Promise<number> {
    const monitors = await monitorClient.listMonitors();
    let completed = 0;

    for (const monitor of monitors) {
      try {
        const payload = await httpChecker.check(monitor.url);
        await monitorClient.reportCheck(monitor.id, payload);
        completed += 1;
        log.info(
          {
            monitorId: monitor.id,
            status: payload.status,
            responseTimeMs: payload.responseTimeMs,
          },
          "check completed",
        );
      } catch (error) {
        log.error({ err: error, monitorId: monitor.id }, "check failed");
      }
    }

    return completed;
  }

  return {
    runOnce,
    start(intervalMs) {
      if (timer) {
        return;
      }
      const tick = () => {
        void runOnce().catch((error) => {
          log.error({ err: error }, "check cycle failed");
        });
      };
      tick();
      timer = setInterval(tick, intervalMs);
    },
    stop() {
      if (timer) {
        clearInterval(timer);
        timer = undefined;
      }
    },
  };
}
