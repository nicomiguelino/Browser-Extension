#!/bin/bash -ex
# vim: tabstop=4 shiftwidth=4 softtabstop=4
# -*- sh-basic-offset: 4 -*-

docker run \
    --rm \
    sce_webpack:latest \
    /bin/bash -c "npx webpack --config webpack.dev.js && npm run teamcity"
