import * as grpc from "@grpc/grpc-js";
import type { MonitorStatus } from "../domain/types.js";
import { loadPulsePackage } from "./proto.js";

export interface GrpcCheckRequest {
  monitorId: string;
  url: string;
}

export interface GrpcCheckResult {
  monitorId: string;
  status: MonitorStatus;
  httpStatusCode: number | null;
  responseTimeMs: number | null;
  errorMessage: string | null;
}

interface PulseService {
  new (
    address: string,
    credentials: grpc.ChannelCredentials,
  ): grpc.Client & {
    CheckOnce: (
      request: Record<string, unknown>,
      callback: (
        error: grpc.ServiceError | null,
        response: Record<string, unknown>,
      ) => void,
    ) => void;
    close: () => void;
  };
}

export function createCheckGrpcClient(address: string) {
  const pulseNamespace = loadPulsePackage().pulse as Record<string, unknown>;
  const CheckService = pulseNamespace.CheckService as PulseService;
  const client = new CheckService(address, grpc.credentials.createInsecure());

  return {
    async checkOnce(request: GrpcCheckRequest): Promise<GrpcCheckResult> {
      return new Promise((resolve, reject) => {
        client.CheckOnce(
          {
            monitorId: request.monitorId,
            url: request.url,
          },
          (error, response) => {
            if (error) {
              reject(error);
              return;
            }
            const status = String(response.status ?? "UNKNOWN");
            resolve({
              monitorId: String(response.monitorId ?? request.monitorId),
              status:
                status === "UP" || status === "DOWN" || status === "UNKNOWN"
                  ? status
                  : "UNKNOWN",
              httpStatusCode: Number(response.httpStatusCode ?? 0) || null,
              responseTimeMs: Number(response.responseTimeMs ?? 0) || null,
              errorMessage: String(response.errorMessage ?? "") || null,
            });
          },
        );
      });
    },
    close() {
      client.close();
    },
  };
}

export type CheckGrpcClient = ReturnType<typeof createCheckGrpcClient>;
