FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache git
COPY package.json ./
RUN npm install
COPY index.js /app/index.js
CMD ["node", "index.js"]
