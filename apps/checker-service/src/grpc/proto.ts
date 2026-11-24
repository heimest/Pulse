import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

const PROTO_CANDIDATES = [
  path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../../../packages/contracts/proto/pulse.proto",
  ),
  path.join(process.cwd(), "packages/contracts/proto/pulse.proto"),
  path.join(process.cwd(), "pulse.proto"),
];

export function resolveProtoPath(): string {
  const protoPath = PROTO_CANDIDATES.find((candidate) =>
    fs.existsSync(candidate),
  );
  if (!protoPath) {
    throw new Error(
      `pulse.proto not found (searched: ${PROTO_CANDIDATES.join(", ")})`,
    );
  }
  return protoPath;
}

export function loadPulsePackage(): grpc.GrpcObject {
  const definition = protoLoader.loadSync(resolveProtoPath(), {
    keepCase: false,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });
  return grpc.loadPackageDefinition(definition) as grpc.GrpcObject;
}
