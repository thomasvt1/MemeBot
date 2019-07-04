#!/bin/bash

docker run -d --name memebot thomasvt1/memebot:latest
docker cp configdata/config.js memebot:/home/user/config.js
docker start memebot