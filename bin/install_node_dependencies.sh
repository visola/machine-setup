#!/bin/bash
cd ~/bin
echo "Installing node dependencies in directory $(pwd)"
npm install
echo "-- node_modules dir now looks like this:"
ls -lah node_modules
echo "--"
