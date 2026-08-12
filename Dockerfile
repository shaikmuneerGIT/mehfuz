# Single image that builds and runs the whole Mehfuz app (API + storefront).
# Reuses the exact npm scripts already verified locally and on Render, so
# there's one build recipe instead of two.

FROM node:22-slim

WORKDIR /app

# Install dependencies first so this layer is cached unless package.json
# actually changes — makes repeat builds on the VPS much faster.
COPY package.json ./
COPY server/package.json server/package-lock.json ./server/
COPY client/package.json client/package-lock.json ./client/
RUN npm run install:all

COPY server ./server
COPY client ./client
RUN npm run build

ENV NODE_ENV=production
EXPOSE 4000

# Runs pending migrations and the (idempotent) seed before starting, every
# time the container boots — see package.json for why that's safe.
CMD ["npm", "run", "render-start"]
