#!/usr/bin/env bash
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

if ! command -v istioctl >/dev/null 2>&1; then
  echo "Installing Istio ${ISTIO_VERSION} locally..."
  TMP_DIR="$(mktemp -d)"
  (
    cd "${TMP_DIR}"
    curl -fsSL "https://istio.io/downloadIstio" | ISTIO_VERSION="${ISTIO_VERSION}" sh -
  )
  export PATH="${TMP_DIR}/istio-${ISTIO_VERSION}/bin:${PATH}"
  ISTIO_HOME="${TMP_DIR}/istio-${ISTIO_VERSION}"
else
  ISTIO_HOME="$(dirname "$(dirname "$(command -v istioctl)")")"
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

echo "Applying Pulse Postgres ConfigMap and Secret..."
kubectl apply -f "${ROOT_DIR}/infra/k8s/configmap.yaml"
kubectl apply -f "${ROOT_DIR}/infra/k8s/secret.yaml"

echo "Cluster bootstrap complete."
echo "Point Docker at Minikube with: eval \$(minikube docker-env)"
