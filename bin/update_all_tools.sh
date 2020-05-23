#!/bin/bash

temp_dir=$(mktemp -d -t ms)
echo "Using temp dir: $temp_dir"

echo "--- Updating cicd ---"
curl -L -o $temp_dir/cicd.zip https://github.com/VinnieApps/cicd-toolbox/releases/latest/download/cicd_darwin_amd64.zip
unzip -d $temp_dir/cicd/ $temp_dir/cicd.zip
cp -v $temp_dir/cicd/cicd ~/bin/

echo "--- Updating http ---"
curl -L -o $temp_dir/http.zip https://github.com/visola/go-http-cli/releases/latest/download/go-http-cli_darwin_amd64.zip
unzip -d $temp_dir/http/ $temp_dir/http.zip
cp -v $temp_dir/http/http ~/bin/
cp -v $temp_dir/http/go-http-completion ~/bin/
cp -v $temp_dir/http/go-http-daemon ~/bin/

echo "Cleaning up..."
rm -Rfv $temp_dir
