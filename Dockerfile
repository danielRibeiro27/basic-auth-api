FROM node:lts-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# Run Jest unit tests, then start the server and run Newman integration tests
CMD ["sh", "-c", "npm test && node src/index.js & sleep 3 && npm run test:api"]
