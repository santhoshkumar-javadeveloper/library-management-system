FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .
RUN node -e "require('fs').mkdirSync('migrations', { recursive: true })" 2>/dev/null || true

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "src/server.js"]
