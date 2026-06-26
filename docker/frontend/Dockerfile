FROM node:22-alpine AS build

ARG VITE_CHAT_MAX_RAG_DOCS=5

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install --no-fund --no-audit

COPY . .

ENV VITE_CHAT_MAX_RAG_DOCS=${VITE_CHAT_MAX_RAG_DOCS}

RUN npm run build

FROM nginx:1.29-alpine

COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
