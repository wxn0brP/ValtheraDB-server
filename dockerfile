FROM oven/bun:latest
RUN apk add --no-cache git
WORKDIR /app

COPY package.json ./
RUN bun i
COPY dist ./dist
COPY gui ./gui

VOLUME ["/app/volumes"]

EXPOSE 14785
CMD ["bun", "run", "./server/index.ts"]
