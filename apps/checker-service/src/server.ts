import { buildApp, type CheckerDependencies } from "./app.js";
import { startCheckGrpcServer } from "./grpc/server.js";
import { createHttpChecker } from "./http-checker.js";
import { createMonitorClient } from "./monitor-client.js";
import { createCheckRunner } from "./runner.js";

const port = Number(process.env.PORT ?? 3001);
const grpcPort = Number(process.env.GRPC_PORT ?? 50051);
const pollIntervalMs = Number(process.env.CHECK_INTERVAL_MS ?? 30_000);
const monitorServiceUrl =
  process.env.MONITOR_SERVICE_URL ?? "http://127.0.0.1:3000";

const httpChecker = createHttpChecker();
const deps: CheckerDependencies = {};
const app = buildApp(deps);

deps.runner = createCheckRunner(
  createMonitorClient(monitorServiceUrl),
  httpChecker,
  app.log,
);
deps.runner.start(pollIntervalMs);

const grpcServer = startCheckGrpcServer(
  httpChecker,
  `0.0.0.0:${grpcPort}`,
  app.log,
);

app.addHook("onClose", async () => {
  deps.runner?.stop();
  grpcServer.tryShutdown(() => undefined);
});

try {
  await app.listen({ host: "0.0.0.0", port });
  app.log.info(
    { monitorServiceUrl, pollIntervalMs, grpcPort },
    "checker service started",
  );
} catch (error) {
  app.log.error(error);
  deps.runner?.stop();
  grpcServer.forceShutdown();
  process.exitCode = 1;
}
