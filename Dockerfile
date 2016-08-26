FROM node:latest
MAINTAINER lfarzati@gmail.com

WORKDIR /usr/src
COPY package.json /usr/src/package.json
RUN npm install
COPY index.js /usr/src/

USER nobody
ENV token=$token
CMD ["node","index.js"]
