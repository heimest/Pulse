import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  createMonitor,
  deleteMonitor,
  fetchMonitors,
  type MonitorView,
} from "./api";

export function App() {
  const [monitors, setMonitors] = useState<MonitorView[]>([]);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("https://example.com");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      setMonitors(await fetchMonitors());
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to load monitors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, 15_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await createMonitor({ name, url });
      setName("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to create monitor");
    }
  }

  async function onDelete(id: string) {
    setError(null);
    try {
      await deleteMonitor(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to delete monitor");
    }
  }

  return (
    <div className="page">
      <header className="hero">
        <p className="brand">Pulse</p>
        <h1>HTTP availability at a glance</h1>
        <p className="lede">
          Monitors composed through GraphQL, checked by the mesh-backed
          services.
        </p>
      </header>

      <main className="content">
        <form className="create" onSubmit={onSubmit}>
          <label>
            Name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Example API"
              required
            />
          </label>
          <label>
            URL
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com"
              required
            />
          </label>
          <button type="submit">Add monitor</button>
        </form>

        {error ? <p className="error">{error}</p> : null}
        {loading && monitors.length === 0 ? (
          <p className="muted">Loading monitors…</p>
        ) : null}

        <section className="list" aria-label="Monitors">
          {monitors.map((monitor) => {
            const status = monitor.latestCheck?.status ?? "UNKNOWN";
            return (
              <article key={monitor.id} className="monitor">
                <div>
                  <h2>{monitor.name}</h2>
                  <p className="url">{monitor.url}</p>
                  <p className={`status status-${status.toLowerCase()}`}>
                    {status}
                    {monitor.latestCheck?.responseTimeMs != null
                      ? ` · ${monitor.latestCheck.responseTimeMs} ms`
                      : ""}
                  </p>
                </div>
                <button
                  type="button"
                  className="danger"
                  onClick={() => void onDelete(monitor.id)}
                >
                  Remove
                </button>
              </article>
            );
          })}
          {!loading && monitors.length === 0 ? (
            <p className="muted">No monitors yet.</p>
          ) : null}
        </section>
      </main>
    </div>
  );
}
