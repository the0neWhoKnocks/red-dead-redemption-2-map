#!/usr/bin/env node

/**
 * Usage:
 * ./bin/adjust-coords.js ./public/markers.default.json 1.342 1.341
 */

const [
  FILE_PATH,
  LAT_OFFSET,
  LNG_OFFSET,
] = process.argv.splice(2);
const errors = [];

if (FILE_PATH === undefined) errors.push('Missing `FILE_PATH` argument');
if (LAT_OFFSET === undefined) errors.push('Missing `LAT_OFFSET` argument');
if (LNG_OFFSET === undefined) errors.push('Missing `LNG_OFFSET` argument');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

const { readFile, writeFile } = require('fs');
const { resolve } = require('path');
const ABS_FILE_PATH = resolve(__dirname, '../', FILE_PATH);

readFile(ABS_FILE_PATH, 'utf8', (loadErr, file) => {
  if (loadErr) return console.error(loadErr);
  
  const markers = JSON.parse(file).map((marker) => {
    return {
      ...marker,
      lat: marker.lat * LAT_OFFSET,
      lng: marker.lng * LNG_OFFSET,
    };
  });
  
  writeFile(ABS_FILE_PATH, JSON.stringify(markers, null, 2), 'utf8', (writeErr, file) => {
    if (writeErr) return console.error(writeErr);
    console.log('CoOrds Adjusted');
  });
});
