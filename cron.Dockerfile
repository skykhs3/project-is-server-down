FROM node:22-alpine

WORKDIR /app

# Enable Corepack
RUN corepack enable

# Copy the rest of the files
COPY . .

ENV UV_THREADPOOL_SIZE=64

RUN pnpm install

# Build the cron app
RUN pnpm run build --filter=cron

CMD ["pnpm", "run", "start", "--filter=cron"]
