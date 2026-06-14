FROM node:20-alpine
WORKDIR /app

# Install build deps for better-sqlite3 native module
RUN apk add --no-cache python3 make g++

COPY package.json ./
RUN npm install --omit=dev

COPY server.js ./

# Data directory for SQLite (mount as volume in docker-compose)
VOLUME /data

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/data/analytics.db

EXPOSE 3000
CMD ["node", "server.js"]
