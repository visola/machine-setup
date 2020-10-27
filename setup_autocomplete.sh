#!/bin/bash

if [ -d ~/autocomplete/ ]; then
  if [ -n "$BASH_VERSION" ]; then
    for f in ~/autocomplete/*.bash; do
      . $f
    done
  fi
fi
