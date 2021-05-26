FROM node:14-alpine AS builder
COPY . /app
WORKDIR /app
RUN rm -rf ./dist
RUN npm install
RUN npx tsc

FROM node:14-alpine AS dist
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/node_modules /app/node_modules
CMD [ "node", "/app/dist/index.js" ]