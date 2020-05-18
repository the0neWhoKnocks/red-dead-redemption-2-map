#!/bin/bash

ROOT_OUTPUT_DIR="$PWD/public/imgs/tiles2"
# remove old files
# TODO - make the below optional
# rm -rf "$ROOT_OUTPUT_DIR/*"

tileSets=( \
  "2 3 3" \
  "3 7 7" \
  "4 15 15" \
  "5 31 31" \
  "6 63 63" \
  "7 127 127" \
  "8 255 255" \
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
      tileURL="https://oyster.ignimgs.com/ignmedia/wikimaps/red-dead-redemption-2/hi-res/$dir/$xPos-$yPos.jpg"
      # tileURL="https://s.rsg.sc/sc/images/games/RDR2/map/game/$dir/$xPos/$yPos.jpg"
      echo "Downloading $tileURL"
      curl -s "$tileURL" -o "$zoomLevelOutputDir/$xPos"'_'"$yPos.jpg"
    done
  done
done
