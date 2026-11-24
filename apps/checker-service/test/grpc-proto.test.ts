import { expect, test } from "vitest";
import { resolveProtoPath } from "../src/grpc/proto.js";

test("pulse.proto is resolvable for the checker gRPC server", () => {
  expect(resolveProtoPath()).toMatch(/pulse\.proto$/);
});
