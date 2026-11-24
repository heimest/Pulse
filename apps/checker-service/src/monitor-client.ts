import type { CheckPayload, Monitor, MonitorClient } from "./types.js";

export function createMonitorClient(baseUrl: string): MonitorClient {
  const normalized = baseUrl.replace(/\/$/, "");

  return {
    async listMonitors() {
      const response = await fetch(`${normalized}/monitors`);
      if (!response.ok) {
        throw new Error(`failed to list monitors: ${response.status}`);
      }
      return (await response.json()) as Monitor[];
    },

    async reportCheck(monitorId, payload: CheckPayload) {
      const response = await fetch(
        `${normalized}/monitors/${monitorId}/checks`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!response.ok) {
        throw new Error(
          `failed to report check for ${monitorId}: ${response.status}`,
        );
      }
    },
  };
}
