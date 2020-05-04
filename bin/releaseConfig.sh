#!/bin/bash

BUILD_CMD='docker-compose build'
START_CMD='docker-compose up -d'
APP_URL="http://localhost:3000"
APP_NAME="rdr2-map"
DOCKER_USER="theonewhoknocks"
DOCKER_PASS=$(cat $( dirname $0 )/.dockercreds 2> /dev/null)

echo;
echo " Loaded release script config"
echo;
