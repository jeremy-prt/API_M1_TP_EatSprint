FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
COPY src ./src
COPY tsconfig.json ./
COPY prisma.config.ts ./

RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runtime

WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/src/generated ./src/generated
COPY prisma ./prisma
COPY entrypoint.sh ./entrypoint.sh

RUN chmod +x entrypoint.sh

USER appuser

EXPOSE 3000

CMD ["./entrypoint.sh"]
