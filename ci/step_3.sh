#!/bin/bash -ex
# vim: tabstop=4 shiftwidth=4 softtabstop=4
# -*- sh-basic-offset: 4 -*-

# Save the build as a teamcity artifact.

mkdir dist

docker run \
    --rm \
    -v $(pwd)/dist:/app/dist:delegated \
    sce_webpack:latest npm build

