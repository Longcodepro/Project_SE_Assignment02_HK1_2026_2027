FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY prisma.config.ts ./
COPY prisma ./prisma
COPY --from=build /app/src/generated ./src/generated
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/main"]
