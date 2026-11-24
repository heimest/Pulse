import { buildApp, type CheckerDependencies } from "./app.js";
import { createHttpChecker } from "./http-checker.js";
import { createMonitorClient } from "./monitor-client.js";
import { createCheckRunner } from "./runner.js";

const port = Number(process.env.PORT ?? 3001);
const pollIntervalMs = Number(process.env.CHECK_INTERVAL_MS ?? 30_000);
const monitorServiceUrl =
  process.env.MONITOR_SERVICE_URL ?? "http://127.0.0.1:3000";

const deps: CheckerDependencies = {};
const app = buildApp(deps);

deps.runner = createCheckRunner(
  createMonitorClient(monitorServiceUrl),
  createHttpChecker(),
  app.log,
);
deps.runner.start(pollIntervalMs);

app.addHook("onClose", async () => {
  deps.runner?.stop();
});

try {
  await app.listen({ host: "0.0.0.0", port });
  app.log.info(
    { monitorServiceUrl, pollIntervalMs },
    "checker service started",
  );
} catch (error) {
  app.log.error(error);
  deps.runner?.stop();
  process.exitCode = 1;
}
