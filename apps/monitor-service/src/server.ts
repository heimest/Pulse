import { buildApp } from "./app.js";
import { createStore } from "./store/create-store.js";

const port = Number(process.env.PORT ?? 3000);
const store = await createStore();
const app = buildApp({ store });

try {
  await app.listen({ host: "0.0.0.0", port });
} catch (error) {
  app.log.error(error);
  await store.close();
  process.exitCode = 1;
}
