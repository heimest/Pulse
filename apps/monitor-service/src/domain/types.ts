export type MonitorStatus = "UP" | "DOWN" | "UNKNOWN";

export interface Monitor {
  id: string;
  name: string;
  url: string;
  intervalSeconds: number;
  createdAt: string;
}

export interface CheckResult {
  id: string;
  monitorId: string;
  status: MonitorStatus;
  httpStatusCode: number | null;
  responseTimeMs: number | null;
  checkedAt: string;
  errorMessage: string | null;
}

export interface CreateMonitorInput {
  name: string;
  url: string;
  intervalSeconds?: number;
}

export interface CreateCheckInput {
  status: MonitorStatus;
  httpStatusCode?: number | null;
  responseTimeMs?: number | null;
  errorMessage?: string | null;
}

export interface MonitorStore {
  listMonitors(): Promise<Monitor[]>;
  getMonitor(id: string): Promise<Monitor | null>;
  createMonitor(input: CreateMonitorInput): Promise<Monitor>;
  deleteMonitor(id: string): Promise<boolean>;
  listChecks(monitorId: string, limit?: number): Promise<CheckResult[]>;
  addCheck(
    monitorId: string,
    input: CreateCheckInput,
  ): Promise<CheckResult | null>;
  ready(): Promise<boolean>;
  close(): Promise<void>;
}
