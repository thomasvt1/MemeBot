FROM node:alpine

RUN apk --no-cache --update add git mariadb-dev python g++ make

RUN adduser -D user
USER user
WORKDIR /home/user

COPY --chown="user:user" . /home/user