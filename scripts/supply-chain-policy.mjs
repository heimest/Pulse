#!/usr/bin/env node
/**
 * Local supply-chain policy for Pulse.
 *
 * Fails when workflows use mutable Action tags, or when Dockerfiles pull
 * registry images without a digest. Local build stages (FROM base AS …)
 * are allowed without a digest.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const errors = [];

const ACTION_SHA = /^[0-9a-f]{40}$/;
const IMAGE_DIGEST = /@sha256:[0-9a-f]{64}(?:\s|$)/i;

function isRegistryImage(fromInstruction) {
  // Strip "FROM" / options / stage alias: "FROM [--platform=…] image AS name"
  const withoutFrom = fromInstruction.replace(/^FROM\s+/i, "");
  const withoutOptions = withoutFrom.replace(/^--\S+\s+/g, "");
  const imageRef = withoutOptions.split(/\s+AS\s+/i)[0]?.trim() ?? "";
  if (!imageRef || imageRef === "scratch") {
    return false;
  }
  // Local stage names have no registry/tag/digest markers.
  return (
    imageRef.includes("/") || imageRef.includes(":") || imageRef.includes("@")
  );
}

function checkWorkflows() {
  const dir = join(root, ".github", "workflows");
  for (const name of readdirSync(dir).sort()) {
    if (!name.endsWith(".yml") && !name.endsWith(".yaml")) {
      continue;
    }
    const path = join(dir, name);
    const lines = readFileSync(path, "utf8").split("\n");
    lines.forEach((line, index) => {
      const stripped = line.trim();
      if (!stripped.startsWith("uses:")) {
        return;
      }
      const reference = stripped.slice("uses:".length).split("#", 1)[0].trim();
      if (reference.startsWith("./")) {
        return;
      }
      const sha = reference.includes("@") ? reference.split("@").pop() : "";
      if (!ACTION_SHA.test(sha ?? "")) {
        errors.push(
          `${relative(root, path)}:${index + 1}: action not pinned to a full commit SHA`,
        );
      }
    });
  }
}

function checkDockerfiles() {
  const appsDir = join(root, "apps");
  for (const app of readdirSync(appsDir).sort()) {
    const path = join(appsDir, app, "Dockerfile");
    let content;
    try {
      content = readFileSync(path, "utf8");
    } catch {
      continue;
    }
    content.split("\n").forEach((line, index) => {
      const stripped = line.trim();
      if (!stripped.toUpperCase().startsWith("FROM ")) {
        return;
      }
      if (!isRegistryImage(stripped)) {
        return;
      }
      if (!IMAGE_DIGEST.test(stripped)) {
        errors.push(
          `${relative(root, path)}:${index + 1}: registry base image not pinned to a digest`,
        );
      }
    });
  }
}

checkWorkflows();
checkDockerfiles();

if (errors.length > 0) {
  console.error("Supply-chain policy failed:");
  for (const error of errors) {
    console.error(`  ${error}`);
  }
  process.exit(1);
}

console.log("OK supply-chain policy");
