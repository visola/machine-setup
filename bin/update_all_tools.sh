#!/bin/bash

echo "--- Updating cicd ---"
curl -L -o ~/bin/cicd https://github.com/VinnieApps/cicd-toolbox/releases/latest/download/cicd_amd64_darwin && chmod +x ~/bin/cicd
