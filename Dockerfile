FROM node:lts-alpine AS builder
COPY . /app
WORKDIR /app
RUN rm -rf ./dist
RUN npm install --global corepack@latest
RUN corepack enable pnpm
RUN pnpm install --frozen-lockfile
RUN pnpm run build
RUN pnpm prune --prod

FROM node:lts-alpine AS dist
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/node_modules /app/node_modules
CMD [ "node", "/app/dist/index.js" ]