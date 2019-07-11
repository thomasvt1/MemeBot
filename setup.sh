#!/bin/bash

docker run --name mongo -d mongo:4.0.10
docker network create database
docker network connect database mongo
docker run -d --name memebot thomasvt1/memebot:latest
docker cp configdata/config.js memebot:/home/user/config.js
docker network connect database memebot