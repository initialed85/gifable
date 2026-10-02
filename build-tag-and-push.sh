#!/usr/bin/env bash

set -e

pushd "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)" >/dev/null 2>&1

if hostname -I >/dev/null 2<&1 && hostname -I | grep "172.22." >/dev/null 2<&1; then
  REGISTRY="ftp-kube-hetzner-infra"
else
  REGISTRY="${REGISTRY:-ftp-kube-prod}"
fi

IMAGE_NAME="registry.${REGISTRY}.ftpsolutions.com.au/gifable"

docker build --progress=plain --platform=linux/amd64 -t "${IMAGE_NAME}:latest" -f ./Dockerfile ./

docker image push "${IMAGE_NAME}:latest"
