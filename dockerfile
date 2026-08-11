FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Copy the full source before generating the Prisma client — the client
# lands under src/generated/prisma, and copying source afterward would
# overwrite that freshly generated directory with the host's (client-less) copy.
COPY . .
RUN npx prisma generate
RUN npm run build

# ---------- runtime stage ----------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
# Full install (not --omit=dev): the Prisma CLI is a devDependency but is
# still needed at container start to run `prisma migrate deploy`.
RUN npm ci

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
