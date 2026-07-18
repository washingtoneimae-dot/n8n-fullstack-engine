FROM node:20-alpine

RUN npm install -g tsx

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 3000

CMD ["tsx", "src/index.ts"]
