# Copyright (c) 2019 thomasvt1/MemeBot
# Original copyright (c) 2018-2019 dzervas
# Last modified by Keanu73 <keanu@keanu73.net> on 2019-06-30
# All rights reserved.


FROM node:alpine

RUN apk --no-cache --update add python git g++ make

RUN adduser -D user
USER user
COPY --chown="user:user" . /home/user
WORKDIR /home/user

RUN npm install
CMD ["npm", "start"]