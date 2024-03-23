#!/bin/bash

setopt PROMPT_SUBST

SCRIPT_DIR="$( cd "$( dirname "$0}" )" && pwd )"

pushd $SCRIPT_DIR >> /dev/null

source sync_dirs.sh

source aliases.sh
source setup_autocomplete.sh

source set_prompt.sh

export PATH=~/bin:$PATH

popd >> /dev/null

~/bin/get-quote
