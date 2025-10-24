FROM node:16 AS build
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production

FROM node:16-alpine@sha256:a9b9cb880fa429b0bea899cd3b1bc081ab7277cc97e6d2dcd84bd9753b2027e1

# ===== Fix any security vulnerability according to Snyk ===
RUN echo "http://dl-cdn.alpinelinux.org/alpine/edge/main" >> /etc/apk/repositories && \
    apk update && \
    apk add --no-cache \
    apk-tools~=2.12
# hadolint disable=DL3059
RUN apk add --no-cache \
    dumb-init~=1.2 \
    libcrypto1.1~=1.1 \
    busybox~=1.33 
# ============================================================

ENV NODE_ENV=production

RUN mkdir -p /usr/src/app && chown node:node /usr/src/app

USER node
WORKDIR /usr/src/app

COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node . .
RUN [ -f ".env" ] || cp .env.docker .env

CMD [ "dumb-init", "node", "mqttclient.js" ]
