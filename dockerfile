FROM node:22-alpine
RUN apk add --no-cache git
WORKDIR /app

COPY package.json ./
RUN npm i
COPY dist ./dist
COPY gui ./gui
COPY gui-script/dist ./gui-script/dist

EXPOSE 14785
CMD ["npm", "start"]
