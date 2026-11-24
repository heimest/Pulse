import { randomUUID } from "node:crypto";
import type {
  CheckResult,
  CreateCheckInput,
  CreateMonitorInput,
  Monitor,
  MonitorStore,
} from "../domain/types.js";

const DEFAULT_INTERVAL_SECONDS = 30;
const DEFAULT_CHECK_LIMIT = 50;

export function createMemoryStore(): MonitorStore {
  const monitors = new Map<string, Monitor>();
  const checks = new Map<string, CheckResult[]>();

  return {
    async listMonitors() {
      return [...monitors.values()].sort((a, b) =>
        a.createdAt.localeCompare(b.createdAt),
      );
    },

    async getMonitor(id) {
      return monitors.get(id) ?? null;
    },

    async createMonitor(input: CreateMonitorInput) {
      const monitor: Monitor = {
        id: randomUUID(),
        name: input.name,
        url: input.url,
        intervalSeconds: input.intervalSeconds ?? DEFAULT_INTERVAL_SECONDS,
        createdAt: new Date().toISOString(),
      };
      monitors.set(monitor.id, monitor);
      checks.set(monitor.id, []);
      return monitor;
    },

    async deleteMonitor(id) {
      const removed = monitors.delete(id);
      checks.delete(id);
      return removed;
    },

    async listChecks(monitorId, limit = DEFAULT_CHECK_LIMIT) {
      if (!monitors.has(monitorId)) {
        return [];
      }
      return (checks.get(monitorId) ?? []).slice(0, limit);
    },

    async addCheck(monitorId, input: CreateCheckInput) {
      if (!monitors.has(monitorId)) {
        return null;
      }
      const check: CheckResult = {
        id: randomUUID(),
        monitorId,
        status: input.status,
        httpStatusCode: input.httpStatusCode ?? null,
        responseTimeMs: input.responseTimeMs ?? null,
        checkedAt: new Date().toISOString(),
        errorMessage: input.errorMessage ?? null,
      };
      const existing = checks.get(monitorId) ?? [];
      checks.set(monitorId, [check, ...existing]);
      return check;
    },

    async ready() {
      return true;
    },

    async close() {
      monitors.clear();
      checks.clear();
    },
  };
}
