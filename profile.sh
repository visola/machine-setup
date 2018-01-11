#!/bin/bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

pushd $SCRIPT_DIR >> /dev/null

source sync_dirs.sh
source setup_git_info.sh
source setup_autocomplete.sh
source alias_node_files.sh

popd >> /dev/null

get-quote
