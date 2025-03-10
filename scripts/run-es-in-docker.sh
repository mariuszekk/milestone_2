#!/bin/bash

set -euxo pipefail

function cleanup() {
  docker compose logs -t
  echo "Cleaning up..."
  docker compose down
  echo "Done cleaning up."
}

trap cleanup EXIT

docker compose down -v
docker compose up --build
