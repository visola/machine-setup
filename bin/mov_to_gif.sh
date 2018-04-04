#!/bin/sh

# This script was based off http://blog.pkh.me/p/21-high-quality-gif-with-ffmpeg.html

usage() {
  echo "Usage:"
  echo
  echo "  mov_to_gif.sh {input_file} {output_file} [width [fps]]"
  echo
  exit 1
}

if [ -z "$1" ]; then
  usage
fi

if [ -z "$2" ]; then
  usage
fi

input_file=$1
output_file=$2
width=${3:-600}
fps=${4:-10}

palette="/tmp/palette.png"
if [ -f $palette ]; then
  rm $palette
fi

filters="fps=${fps},scale=${width}:-1:flags=lanczos"

ffmpeg -v warning -i $1 -vf "$filters,palettegen" -y $palette
ffmpeg -v warning -i $1 -i $palette -lavfi "$filters [x]; [x][1:v] paletteuse" -y $2
