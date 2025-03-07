#!/bin/bash

setopt PROMPT_SUBST

SCRIPT_DIR="$( cd "$( dirname "$0}" )" && pwd )"

pushd $SCRIPT_DIR >> /dev/null

source sync_dirs.sh
source aliases.sh
source set_prompt.sh

autoload -Uz compinit && compinit

export PATH=~/bin:$PATH

popd >> /dev/null

~/bin/get-quote
