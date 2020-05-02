#!/bin/bash

OUTPUT_DIR="./public"

cp "node_modules/leaflet/dist/leaflet.css" "$OUTPUT_DIR/css/"
cp -r "node_modules/leaflet/dist/images" "$OUTPUT_DIR/css/"
cp "node_modules/leaflet/dist/leaflet.js" "$OUTPUT_DIR/js/"
