FROM oven/bun:latest
RUN apt update && apt install -y git
WORKDIR /app

COPY package.json ./
RUN bun i
COPY mgmt ./mgmt
COPY server ./server
COPY gui ./gui

VOLUME ["/app/volumes"]

EXPOSE 14785
EXPOSE 14786
CMD ["bun", "run", "./server/index.ts"]
