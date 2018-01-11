#!/bin/bash

for f in ~/bin/*.js; do
  file=`echo $f | rev | cut -d'/' -f 1 | rev`
  command=`echo $file | cut -d'.' -f 1`
  alias $command="node $f \$*"
done
