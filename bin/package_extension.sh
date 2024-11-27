#!/usr/bin/env bash

set -euo pipefail
IFS=$'\n\t'

VERSION=${VERSION:-0.0.0}
PLATFORM=${PLATFORM:-chrome}

if [[ ! $PLATFORM =~ ^(chrome|firefox)$ ]]; then
    echo "Invalid platform: $PLATFORM"
    echo "Platform should be either chrome or firefox"
    exit 1
fi

cat src/manifest-$PLATFORM.json \
    | jq --arg version "$VERSION" '.version = $version' \
    > src/manifest.json

docker compose build
docker run \
    --rm -ti \
    -v $(pwd):/app:delegated \
    -v /app/node_modules \
    sce_webpack:latest \
    /bin/bash -c "npx webpack --config webpack.prod.js"

(cd dist && zip -r ../screenly-$PLATFORM-extension-$VERSION.zip *)
