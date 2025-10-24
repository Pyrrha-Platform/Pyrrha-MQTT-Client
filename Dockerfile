FROM node:18 AS build
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine

# ===== Fix any security vulnerability according to Snyk ===
RUN echo "http://dl-cdn.alpinelinux.org/alpine/edge/main" >> /etc/apk/repositories && \
    apk update && \
    apk add --no-cache \
    apk-tools
# hadolint disable=DL3059
RUN apk add --no-cache \
    dumb-init \
    openssl \
    busybox
# ============================================================

ENV NODE_ENV=production

RUN mkdir -p /usr/src/app && chown node:node /usr/src/app

USER node
WORKDIR /usr/src/app

COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node . .
RUN [ -f ".env" ] || cp .env.docker .env

CMD [ "dumb-init", "node", "mqttclient.js" ]
