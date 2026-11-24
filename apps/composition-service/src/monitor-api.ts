export interface Monitor {
  id: string;
  name: string;
  url: string;
  intervalSeconds: number;
  createdAt: string;
}

export interface Check {
  id: string;
  monitorId: string;
  status: string;
  httpStatusCode: number | null;
  responseTimeMs: number | null;
  checkedAt: string;
  errorMessage: string | null;
}

export function createMonitorApi(baseUrl: string) {
  const normalized = baseUrl.replace(/\/$/, "");

  return {
    async listMonitors(): Promise<Monitor[]> {
      const response = await fetch(`${normalized}/monitors`);
      if (!response.ok) {
        throw new Error(`failed to list monitors: ${response.status}`);
      }
      return (await response.json()) as Monitor[];
    },

    async getMonitor(id: string): Promise<Monitor | null> {
      const response = await fetch(`${normalized}/monitors/${id}`);
      if (response.status === 404) {
        return null;
      }
      if (!response.ok) {
        throw new Error(`failed to get monitor: ${response.status}`);
      }
      return (await response.json()) as Monitor;
    },

    async listChecks(monitorId: string, limit = 5): Promise<Check[]> {
      const response = await fetch(
        `${normalized}/monitors/${monitorId}/checks`,
      );
      if (!response.ok) {
        throw new Error(`failed to list checks: ${response.status}`);
      }
      const checks = (await response.json()) as Check[];
      return checks.slice(0, limit);
    },
  };
}

export type MonitorApi = ReturnType<typeof createMonitorApi>;
