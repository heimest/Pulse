#!/usr/bin/env bash
# Build Pulse images into the Minikube node runtime (works with containerd).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MONITOR_IMAGE="${MONITOR_IMAGE:-pulse/monitor-service:local}"
CHECKER_IMAGE="${CHECKER_IMAGE:-pulse/checker-service:local}"

if ! command -v minikube >/dev/null 2>&1; then
  echo "minikube is required" >&2
  exit 1
fi

if ! minikube status >/dev/null 2>&1; then
  echo "Minikube is not running. Start it with scripts/setup-cluster.sh" >&2
  exit 1
fi

echo "Building ${MONITOR_IMAGE} inside Minikube..."
minikube image build \
  -t "${MONITOR_IMAGE}" \
  -f "${ROOT_DIR}/apps/monitor-service/Dockerfile" \
  "${ROOT_DIR}"

echo "Building ${CHECKER_IMAGE} inside Minikube..."
minikube image build \
  -t "${CHECKER_IMAGE}" \
  -f "${ROOT_DIR}/apps/checker-service/Dockerfile" \
  "${ROOT_DIR}"

echo "Verifying images in Minikube..."
IMAGES="$(minikube image ls)"
echo "${IMAGES}" | grep -q 'pulse/monitor-service:local'
echo "${IMAGES}" | grep -q 'pulse/checker-service:local'
echo "${IMAGES}" | grep 'pulse/'
echo "Images ready."
