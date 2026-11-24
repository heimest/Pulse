export type MonitorStatus = "UP" | "DOWN" | "UNKNOWN";

export interface Monitor {
  id: string;
  name: string;
  url: string;
  intervalSeconds: number;
}

export interface CheckPayload {
  status: MonitorStatus;
  httpStatusCode: number | null;
  responseTimeMs: number | null;
  errorMessage: string | null;
}

export interface MonitorClient {
  listMonitors(): Promise<Monitor[]>;
  reportCheck(monitorId: string, payload: CheckPayload): Promise<void>;
}

export interface HttpChecker {
  check(url: string): Promise<CheckPayload>;
}
