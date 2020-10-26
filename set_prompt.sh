#!/bin/bash

if [ -n "$ZSH_VERSION" ]; then
    NEWLINE=$'\n'
    export PS1="${NEWLINE}---- %(?.%F{green}√.%F{red}%?)%f %n \$(git-info) [%*] ---- ${NEWLINE} %B%3~%b $ "
elif [ -n "$BASH_VERSION" ]; then
    export PS1="\n---- \u @ \h \$(git-info) [\t] ---- \n \w $ "
fi
