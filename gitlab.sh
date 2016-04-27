#!/bin/sh
# executed in gitlab-ci
# default location of code is project dependent (example /builds/Command.Center/eye)
# copy code to standard place that uses caching
cp -R . /src
cd /src && ./ci.sh