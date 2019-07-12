#!/bin/bash -ex
# vim: tabstop=4 shiftwidth=4 softtabstop=4
# -*- sh-basic-offset: 4 -*-

docker run \
    --rm \
    -v $(pwd):/app:delegated \
    -v /app/node_modules \
    sce_webpack:latest npx webpack --config webpack.dev.js && npm teamcity

