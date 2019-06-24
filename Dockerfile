FROM node:8.16.0-alpine

RUN apk --no-cache --update add git mariadb-dev python g++ make

RUN adduser -D user
USER user
COPY --chown="user:user" . /home/user
WORKDIR /home/user

RUN npm install
CMD node index.js