import * as grpc from "@grpc/grpc-js";
import type { HttpChecker } from "../types.js";
import { loadPulsePackage } from "./proto.js";

type RunnerLog = {
  info: (obj: unknown, msg?: string) => void;
  error: (obj: unknown, msg?: string) => void;
};

interface ProtoCheckRequest {
  monitorId?: string;
  url?: string;
}

interface PulseService {
  service: grpc.ServiceDefinition;
}

export function startCheckGrpcServer(
  httpChecker: HttpChecker,
  bindAddress: string,
  log: RunnerLog,
): grpc.Server {
  const pulseNamespace = loadPulsePackage().pulse as Record<string, unknown>;
  const checkService = pulseNamespace.CheckService as PulseService;
  const server = new grpc.Server();

  server.addService(checkService.service, {
    CheckOnce: (
      call: grpc.ServerUnaryCall<ProtoCheckRequest, unknown>,
      callback: grpc.sendUnaryData<Record<string, unknown>>,
    ) => {
      void (async () => {
        try {
          const monitorId = String(call.request.monitorId ?? "");
          const url = String(call.request.url ?? "");
          if (!monitorId || !url) {
            callback({
              code: grpc.status.INVALID_ARGUMENT,
              message: "monitorId and url are required",
            });
            return;
          }

          const payload = await httpChecker.check(url);
          callback(null, {
            monitorId,
            status: payload.status,
            httpStatusCode: payload.httpStatusCode ?? 0,
            responseTimeMs: payload.responseTimeMs ?? 0,
            errorMessage: payload.errorMessage ?? "",
          });
        } catch (error) {
          log.error({ err: error }, "gRPC CheckOnce failed");
          callback({
            code: grpc.status.INTERNAL,
            message: error instanceof Error ? error.message : "check failed",
          });
        }
      })();
    },

    RunChecks: (
      call: grpc.ServerDuplexStream<ProtoCheckRequest, Record<string, unknown>>,
    ) => {
      const pending: Promise<void>[] = [];

      call.on("data", (request: ProtoCheckRequest) => {
        const task = (async () => {
          const monitorId = String(request.monitorId ?? "");
          const url = String(request.url ?? "");
          if (!monitorId || !url) {
            return;
          }
          try {
            const payload = await httpChecker.check(url);
            call.write({
              monitorId,
              status: payload.status,
              httpStatusCode: payload.httpStatusCode ?? 0,
              responseTimeMs: payload.responseTimeMs ?? 0,
              errorMessage: payload.errorMessage ?? "",
            });
          } catch (error) {
            log.error({ err: error, monitorId }, "gRPC RunChecks item failed");
            call.write({
              monitorId,
              status: "DOWN",
              httpStatusCode: 0,
              responseTimeMs: 0,
              errorMessage:
                error instanceof Error ? error.message : "check failed",
            });
          }
        })();
        pending.push(task);
      });

      call.on("end", () => {
        void Promise.all(pending).finally(() => {
          call.end();
        });
      });
    },
  });

  server.bindAsync(
    bindAddress,
    grpc.ServerCredentials.createInsecure(),
    (error, port) => {
      if (error) {
        log.error({ err: error }, "failed to bind gRPC server");
        return;
      }
      log.info({ bindAddress, port }, "checker gRPC server listening");
    },
  );

  return server;
}
