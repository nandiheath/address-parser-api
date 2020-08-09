# Build the dependencies
FROM node:12-alpine AS builder

ENV NODE_ENV production

WORKDIR /build

COPY package.json .

RUN yarn --production --silent

# Build the gatsby website
FROM node:12-alpine AS build

WORKDIR /build

COPY --from=builder /build .

COPY . .

# Kintohub Static Website
FROM node:12-alpine AS release

ENV PORT 3000

WORKDIR /app

COPY --from=build /build .

CMD ["yarn", "start"]