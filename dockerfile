FROM node:25-alpine
RUN apk add --no-cache git
WORKDIR /app

COPY package.json ./
RUN npm i
COPY dist ./dist
COPY gui ./gui

VOLUME ["/app/volumes"]

EXPOSE 14785
CMD ["npm", "start"]
