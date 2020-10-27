#!/bin/bash

if [ -d ~/autocomplete/ ]; then
  if [ -n "$ZSH_VERSION" ]; then
    for f in ~/autocomplete/*.zsh; do
      source $f > /dev/null 2>&1
    done
  elif [ -n "$BASH_VERSION" ]; then
    for f in ~/autocomplete/*.bash; do
      . $f
    done
  fi
fi
