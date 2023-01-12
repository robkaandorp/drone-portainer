FROM node:lts-alpine AS builder
COPY . /app
WORKDIR /app
RUN rm -rf ./dist
RUN npm ci
RUN npx tsc
RUN npm prune --production

FROM node:lts-alpine AS dist
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/node_modules /app/node_modules
CMD [ "node", "/app/dist/index.js" ]