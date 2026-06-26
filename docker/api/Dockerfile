FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install --omit=dev --no-fund --no-audit

FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV CHAT_SERVER_PORT=4174

COPY --from=deps /app/node_modules ./node_modules
COPY server ./server

EXPOSE 4174

CMD ["node", "server/index.mjs"]
