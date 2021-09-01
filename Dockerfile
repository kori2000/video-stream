FROM node:lts-slim

# App work directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

# Build app
RUN npm install --loglevel=error

# Bundle app source into container
COPY main.js .
ADD /public/ public/
ADD /video/ video/

# Port exposed
EXPOSE 8001

# Run Node app
CMD [ "npm", "start" ]