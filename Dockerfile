FROM node:lts-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# Run Jest unit tests, then start the server and run Newman integration tests.
# The loop waits until the server is ready before running Newman.
CMD ["sh", "-c", "npm test && node src/index.js & until wget -qO- http://localhost:3000 >/dev/null 2>&1; do sleep 0.5; done && npm run test:api"]
