FROM node:10-alpine AS builder
COPY . /app
WORKDIR /app
RUN rm -rf ./dist
RUN npm install -g typescript
RUN npm install
RUN tsc

FROM node:10-alpine AS dist
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/node_modules /app/node_modules
CMD [ "node", "/app/dist/index.js" ]