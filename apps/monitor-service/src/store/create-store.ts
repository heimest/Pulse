import type { MonitorStore } from "../domain/types.js";
import { createMemoryStore } from "./memory.js";
import { createPostgresStore } from "./postgres.js";

export async function createStore(
  databaseUrl = process.env.DATABASE_URL,
): Promise<MonitorStore> {
  if (databaseUrl) {
    return createPostgresStore(databaseUrl);
  }
  return createMemoryStore();
}
