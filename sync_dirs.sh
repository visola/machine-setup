#!/bin/bash

# Make sure all files from here are copied to their latest versions
rsync -ahz ./autocomplete ./bin ~
