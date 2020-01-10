#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

COMMANDS_DIR=$DIR/cmd
OUTPUT_DIR=$DIR/binaries

for command_dir in $(ls $COMMANDS_DIR); do
  go build -o $OUTPUT_DIR/$command_dir $COMMANDS_DIR/$command_dir/main.go
done
