FROM node:alpine

RUN apk --no-cache --update add git mariadb-dev python

RUN adduser -D user
USER user
WORKDIR /home/user

COPY --chown="user:user" . /home/user

CMD npm install