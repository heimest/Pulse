#!/usr/bin/env bash
# Build Pulse images into the Minikube node runtime (works with containerd).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

IMAGES=(
  "pulse/monitor-service:local|apps/monitor-service/Dockerfile"
  "pulse/checker-service:local|apps/checker-service/Dockerfile"
  "pulse/composition-service:local|apps/composition-service/Dockerfile"
  "pulse/frontend:local|apps/frontend/Dockerfile"
)

if ! command -v minikube >/dev/null 2>&1; then
  echo "minikube is required" >&2
  exit 1
fi

if ! minikube status >/dev/null 2>&1; then
  echo "Minikube is not running. Start it with scripts/setup-cluster.sh" >&2
  exit 1
fi

for entry in "${IMAGES[@]}"; do
  image="${entry%%|*}"
  dockerfile="${entry##*|}"
  echo "Building ${image} inside Minikube..."
  minikube image build \
    -t "${image}" \
    -f "${ROOT_DIR}/${dockerfile}" \
    "${ROOT_DIR}"
done

echo "Verifying images in Minikube..."
LOADED="$(minikube image ls)"
for entry in "${IMAGES[@]}"; do
  image="${entry%%|*}"
  echo "${LOADED}" | grep -q "${image}"
done
echo "${LOADED}" | grep 'pulse/'
echo "Images ready."
