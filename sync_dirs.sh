#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

# Make sure all files from here are copied to their latest versions
rsync -ahz $DIR/bin/*  ~/bin
