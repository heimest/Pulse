export interface MonitorView {
  id: string;
  name: string;
  url: string;
  intervalSeconds: number;
  latestCheck: {
    status: string;
    responseTimeMs: number | null;
    checkedAt: string;
  } | null;
}

const GRAPHQL_URL = import.meta.env.VITE_GRAPHQL_URL ?? "/composition/graphql";
const MONITOR_API_URL =
  import.meta.env.VITE_MONITOR_API_URL ?? "/monitor-service";

export async function fetchMonitors(): Promise<MonitorView[]> {
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      query: `{
        monitors {
          id
          name
          url
          intervalSeconds
          latestCheck { status responseTimeMs checkedAt }
        }
      }`,
    }),
  });
  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.status}`);
  }
  const payload = (await response.json()) as {
    data?: { monitors: MonitorView[] };
    errors?: Array<{ message: string }>;
  };
  if (payload.errors?.length) {
    throw new Error(payload.errors[0]?.message ?? "GraphQL error");
  }
  return payload.data?.monitors ?? [];
}

export async function createMonitor(input: {
  name: string;
  url: string;
}): Promise<void> {
  const response = await fetch(`${MONITOR_API_URL}/monitors`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: input.name,
      url: input.url,
      intervalSeconds: 30,
    }),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? `create failed: ${response.status}`);
  }
}

export async function deleteMonitor(id: string): Promise<void> {
  const response = await fetch(`${MONITOR_API_URL}/monitors/${id}`, {
    method: "DELETE",
  });
  if (!response.ok && response.status !== 204) {
    throw new Error(`delete failed: ${response.status}`);
  }
}
