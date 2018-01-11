#!/bin/bash

if [ -d ~/autocomplete/ ]; then
  for f in ~/autocomplete/*; do
    . $f
  done
fi
