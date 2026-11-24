import type { MonitorApi } from "./monitor-api.js";

export function createResolvers(api: MonitorApi) {
  return {
    Query: {
      health: () => "ok",
      monitors: () => api.listMonitors(),
      monitor: (_: unknown, args: { id: string }) => api.getMonitor(args.id),
    },
    Monitor: {
      checks: (parent: { id: string }, args: { limit?: number }) =>
        api.listChecks(parent.id, args.limit ?? 5),
      latestCheck: async (parent: { id: string }) => {
        const checks = await api.listChecks(parent.id, 1);
        return checks[0] ?? null;
      },
    },
  };
}
