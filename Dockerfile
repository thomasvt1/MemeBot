FROM node:alpine

RUN apk --no-cache --update add git mariadb-dev

RUN adduser -D user
USER user

COPY --chown="user:user" . /home/user

CMD npm install