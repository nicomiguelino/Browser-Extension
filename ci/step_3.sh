#!/bin/bash -ex
# vim: tabstop=4 shiftwidth=4 softtabstop=4
# -*- sh-basic-offset: 4 -*-

GIT_HASH=$(git rev-parse --short=8 head)

# Save the build as a teamcity artifact.

mkdir artifacts

docker run \
    --rm \
    -v $(pwd)/artifacts:/app/artifacts:delegated \
    sce_webpack:latest \
    /bin/bash -c "cd dist ; zip -r ../artifacts/screenly-chrome-extension-$GIT_HASH.zip *"
