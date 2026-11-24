import type {
  CheckResult,
  CreateMonitorInput,
  Monitor,
  MonitorStore,
} from "../domain/types.js";
import type { CheckGrpcClient } from "../grpc/check-client.js";

export type SagaOutcome =
  | {
      status: "completed";
      monitor: Monitor;
      check: CheckResult;
    }
  | {
      status: "compensated";
      monitor: Monitor;
      check: CheckResult;
      compensation: "monitor_deleted";
      reason: string;
    };

/**
 * Saga: create monitor → first gRPC check → persist result.
 * Compensation: if the first check is DOWN, delete the monitor.
 */
export async function runCreateMonitorSaga(
  store: MonitorStore,
  checker: CheckGrpcClient,
  input: CreateMonitorInput,
): Promise<SagaOutcome> {
  const monitor = await store.createMonitor(input);

  const grpcResult = await checker.checkOnce({
    monitorId: monitor.id,
    url: monitor.url,
  });

  const check = await store.addCheck(monitor.id, {
    status: grpcResult.status,
    httpStatusCode: grpcResult.httpStatusCode,
    responseTimeMs: grpcResult.responseTimeMs,
    errorMessage: grpcResult.errorMessage,
  });

  if (!check) {
    await store.deleteMonitor(monitor.id);
    throw new Error("failed to persist the initial check result");
  }

  if (grpcResult.status === "DOWN") {
    await store.deleteMonitor(monitor.id);
    return {
      status: "compensated",
      monitor,
      check,
      compensation: "monitor_deleted",
      reason: grpcResult.errorMessage ?? "initial check reported DOWN",
    };
  }

  return {
    status: "completed",
    monitor,
    check,
  };
}
