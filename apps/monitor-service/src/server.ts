import { buildApp } from "./app.js";
import { createCheckGrpcClient } from "./grpc/check-client.js";
import { createStore } from "./store/create-store.js";

const port = Number(process.env.PORT ?? 3000);
const checkerGrpcUrl = process.env.CHECKER_GRPC_URL ?? "127.0.0.1:50051";

const store = await createStore();
const checker = createCheckGrpcClient(checkerGrpcUrl);
const app = buildApp({ store, checker });

try {
  await app.listen({ host: "0.0.0.0", port });
  app.log.info({ checkerGrpcUrl }, "monitor service started");
} catch (error) {
  app.log.error(error);
  await store.close();
  checker.close();
  process.exitCode = 1;
}
