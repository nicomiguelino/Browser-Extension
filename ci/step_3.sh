#!/usr/bin/env bash
# vim: tabstop=4 shiftwidth=4 softtabstop=4
# -*- sh-basic-offset: 4 -*-

set -euox pipefail
IFS=$'\n\t'

# Save the build as a teamcity artifact.

mkdir artifacts

docker run \
    --rm \
    -v $(pwd)/artifacts:/app/artifacts:delegated \
    sce_webpack:latest \
    /bin/bash -c "npm run build && cd dist && zip -r ../artifacts/screenly-chrome-extension.zip *"
