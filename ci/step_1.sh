#!/usr/bin/env bash
# vim: tabstop=4 shiftwidth=4 softtabstop=4
# -*- sh-basic-offset: 4 -*-

set -euox pipefail
IFS=$'\n\t'

docker-compose build
