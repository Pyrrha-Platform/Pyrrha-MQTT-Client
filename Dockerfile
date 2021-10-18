FROM node:14 as build
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production

FROM node:14-alpine@sha256:b2da3316acdc2bec442190a1fe10dc094e7ba4121d029cb32075ff59bb27390a

# ===== Fix any security vulnerability according to Snyk ====
RUN apk update && \
    apk add --no-cache \
    apk-tools=2.10.8-r0
# hadolint disable=DL3059
RUN apk add --no-cache \
    dumb-init=1.2.2-r1 \
    libcrypto1.1=1.1.1l-r0 \
    busybox=1.31.1-r10 
# ============================================================

ENV NODE_ENV production

USER node
WORKDIR /usr/src/app

COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node . .
RUN [ -f ".env" ] || cp .env.docker .env

CMD [ "dumb-init", "node", "mqttclient.js" ]
