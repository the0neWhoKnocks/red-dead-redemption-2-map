#!/bin/bash

ROOT_OUTPUT_DIR="$PWD/public/imgs/tiles"
# remove old files
# TODO - make the below optional
# rm -rf "$ROOT_OUTPUT_DIR/*"

tileSets=( \
  "2 2 2" \
  "3 4 5" \
  "4 11 9" \
  "5 23 18" \
  "6 47 37" \
  "7 95 75" \
)

for tileSet in "${tileSets[@]}"; do
  tileSetArr=($tileSet)
  
  dir="${tileSetArr[0]}"
  numberOfColumns="${tileSetArr[1]}"
  numberOfRows="${tileSetArr[2]}"
  
  zoomLevelOutputDir="$ROOT_OUTPUT_DIR/$dir"
  mkdir -p "$zoomLevelOutputDir"
  
  for (( xPos=0; xPos<=$numberOfColumns; xPos++ )); do
    for (( yPos=0; yPos<=$numberOfRows; yPos++ )); do
      tileURL="https://s.rsg.sc/sc/images/games/RDR2/map/game/$dir/$xPos/$yPos.jpg"
      echo "Downloading $tileURL"
      curl -s "$tileURL" -o "$zoomLevelOutputDir/$xPos"'_'"$yPos.jpg"
    done
  done
done
