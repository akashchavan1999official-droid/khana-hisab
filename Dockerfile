FROM node:20-slim
WORKDIR /app
COPY package.json bun.lock* ./
RUN npm install
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/server.js"]