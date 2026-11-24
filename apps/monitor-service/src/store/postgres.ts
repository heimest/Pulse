import { randomUUID } from "node:crypto";
import pg from "pg";
import type {
  CheckResult,
  CreateCheckInput,
  CreateMonitorInput,
  Monitor,
  MonitorStatus,
  MonitorStore,
} from "../domain/types.js";

const { Pool } = pg;

const DEFAULT_INTERVAL_SECONDS = 30;
const DEFAULT_CHECK_LIMIT = 50;

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS monitors (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  interval_seconds INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS check_results (
  id UUID PRIMARY KEY,
  monitor_id UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  http_status_code INTEGER,
  response_time_ms INTEGER,
  checked_at TIMESTAMPTZ NOT NULL,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS check_results_monitor_id_checked_at_idx
  ON check_results (monitor_id, checked_at DESC);
`;

function mapMonitor(row: pg.QueryResultRow): Monitor {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    intervalSeconds: row.interval_seconds,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

function mapCheck(row: pg.QueryResultRow): CheckResult {
  return {
    id: row.id,
    monitorId: row.monitor_id,
    status: row.status as MonitorStatus,
    httpStatusCode: row.http_status_code,
    responseTimeMs: row.response_time_ms,
    checkedAt: new Date(row.checked_at).toISOString(),
    errorMessage: row.error_message,
  };
}

export async function createPostgresStore(
  connectionString: string,
): Promise<MonitorStore> {
  const pool = new Pool({ connectionString });
  await pool.query(SCHEMA_SQL);

  async function getMonitor(id: string): Promise<Monitor | null> {
    const result = await pool.query(
      `SELECT id, name, url, interval_seconds, created_at
       FROM monitors
       WHERE id = $1`,
      [id],
    );
    return result.rows[0] ? mapMonitor(result.rows[0]) : null;
  }

  return {
    async listMonitors() {
      const result = await pool.query(
        `SELECT id, name, url, interval_seconds, created_at
         FROM monitors
         ORDER BY created_at ASC`,
      );
      return result.rows.map(mapMonitor);
    },

    getMonitor,

    async createMonitor(input: CreateMonitorInput) {
      const monitor: Monitor = {
        id: randomUUID(),
        name: input.name,
        url: input.url,
        intervalSeconds: input.intervalSeconds ?? DEFAULT_INTERVAL_SECONDS,
        createdAt: new Date().toISOString(),
      };
      await pool.query(
        `INSERT INTO monitors (id, name, url, interval_seconds, created_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          monitor.id,
          monitor.name,
          monitor.url,
          monitor.intervalSeconds,
          monitor.createdAt,
        ],
      );
      return monitor;
    },

    async deleteMonitor(id) {
      const result = await pool.query(`DELETE FROM monitors WHERE id = $1`, [
        id,
      ]);
      return (result.rowCount ?? 0) > 0;
    },

    async listChecks(monitorId, limit = DEFAULT_CHECK_LIMIT) {
      const result = await pool.query(
        `SELECT id, monitor_id, status, http_status_code, response_time_ms,
                checked_at, error_message
         FROM check_results
         WHERE monitor_id = $1
         ORDER BY checked_at DESC
         LIMIT $2`,
        [monitorId, limit],
      );
      return result.rows.map(mapCheck);
    },

    async addCheck(monitorId, input: CreateCheckInput) {
      const monitor = await getMonitor(monitorId);
      if (!monitor) {
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
      await pool.query(
        `INSERT INTO check_results
           (id, monitor_id, status, http_status_code, response_time_ms,
            checked_at, error_message)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          check.id,
          check.monitorId,
          check.status,
          check.httpStatusCode,
          check.responseTimeMs,
          check.checkedAt,
          check.errorMessage,
        ],
      );
      return check;
    },

    async ready() {
      await pool.query("SELECT 1");
      return true;
    },

    async close() {
      await pool.end();
    },
  };
}
