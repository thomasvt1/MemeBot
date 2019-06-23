FROM node:alpine

RUN apk --no-cache --update add git mariadb-dev

RUN adduser -D user
USER user
WORKDIR /home/user

COPY --chown="user:user" * .

CMD npm install