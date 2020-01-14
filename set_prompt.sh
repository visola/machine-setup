#!/bin/bash

runPrompt() {
  prompt
}
# export PS1="\n---- \u @ \h \$(git-info) [\t] ---- \n \w $ "
export PS1='$(runPrompt)'
