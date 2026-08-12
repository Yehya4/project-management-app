FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# OpenShift requirement: Make the app directory group-writable
RUN chgrp -R 0 /app && chmod -R g=u /app

EXPOSE 5000

# Run as an arbitrary user
USER 1001

CMD ["npm", "start"]