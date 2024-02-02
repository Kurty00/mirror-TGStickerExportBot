FROM node:lts-alpine

MAINTAINER Kurty00 <docker@kurtys.de>

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8010

CMD [ "node", "./index.js" ]