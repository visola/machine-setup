#!/bin/bash -e

for dir in $* ; do
  pushd $dir > /dev/null
  mvn clean
  popd > /dev/null
done
