#!/bin/bash

docker stop memebot
docker rm memebot
docker run -d --name memebot thomasvt1/memebot:latest
docker cp configdata/config.js memebot:/home/user/config.js
docker network connect database memebot
docker start memebot