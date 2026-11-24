#!/usr/bin/env bash
# Bootstrap Minikube + Istio (demo profile) + observability addons for Pulse.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ISTIO_VERSION="${ISTIO_VERSION:-1.24.2}"
MINIKUBE_CPUS="${MINIKUBE_CPUS:-2}"
MINIKUBE_MEMORY="${MINIKUBE_MEMORY:-5000}"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required" >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "docker daemon is not running" >&2
  exit 1
fi

if ! command -v minikube >/dev/null 2>&1; then
  echo "minikube is required" >&2
  exit 1
fi

if ! command -v kubectl >/dev/null 2>&1; then
  echo "kubectl is required" >&2
  exit 1
fi

echo "Starting Minikube (${MINIKUBE_CPUS} CPUs, ${MINIKUBE_MEMORY}Mi)..."
minikube start --cpus="${MINIKUBE_CPUS}" --memory="${MINIKUBE_MEMORY}" --driver=docker

ISTIO_HOME=""
if command -v istioctl >/dev/null 2>&1; then
  ISTIO_BIN="$(command -v istioctl)"
  ISTIO_HOME="$(cd "$(dirname "${ISTIO_BIN}")/.." && pwd)"
else
  echo "Installing Istio ${ISTIO_VERSION} under ${ROOT_DIR}/.tools ..."
  TOOLS_DIR="${ROOT_DIR}/.tools"
  mkdir -p "${TOOLS_DIR}"
  (
    cd "${TOOLS_DIR}"
    curl -fsSL "https://istio.io/downloadIstio" | ISTIO_VERSION="${ISTIO_VERSION}" sh -
  )
  ISTIO_HOME="${TOOLS_DIR}/istio-${ISTIO_VERSION}"
  export PATH="${ISTIO_HOME}/bin:${PATH}"
fi

echo "Installing Istio demo profile..."
istioctl install --set profile=demo -y

echo "Enabling sidecar injection on the default namespace..."
kubectl label namespace default istio-injection=enabled --overwrite

ADDONS_DIR="${ISTIO_HOME}/samples/addons"
if [[ -d "${ADDONS_DIR}" ]]; then
  echo "Installing Istio addons (Kiali, Grafana, Prometheus, Jaeger)..."
  kubectl apply -f "${ADDONS_DIR}"
else
  echo "Istio addons directory not found at ${ADDONS_DIR}; skip addons install" >&2
fi

echo "Cluster bootstrap complete."
echo "Next steps:"
echo "  1. ./scripts/build-images.sh"
echo "  2. ./scripts/deploy-mesh.sh"
echo "  3. ./scripts/ingress-forward.sh   # leave running"
echo "  4. ./scripts/smoke-mesh.sh"
