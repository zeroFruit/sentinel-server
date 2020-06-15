FROM node:10.21.0-alpine3.9

# Create app directory
WORKDIR /usr/src/app

COPY package*.json ./
COPY index.js ./

RUN npm install

COPY . .

EXPOSE 7070
CMD [ "npm", "run", "bootstrap" ]
