FROM node:24-alpine
RUN apk add --no-cache git
WORKDIR /app

COPY package.json ./
RUN npm i
COPY dist ./dist
COPY gui ./gui

EXPOSE 14785
CMD ["npm", "start"]
