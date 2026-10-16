FROM node:22-alpine

WORKDIR /app

# Safe placeholder used only while generating Prisma Client at build time.
ENV DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tenantai_build

# Install dependencies, including build tools.
COPY package*.json ./
RUN npm ci

# Copy the Prisma schema and TypeScript application.
COPY prisma ./prisma
COPY prisma.config.ts tsconfig.json ./
COPY src ./src

# Generate Prisma Client and compile TypeScript.
RUN npx prisma generate
RUN npm run build

# Remove development dependencies from the final image.
RUN npm prune --omit=dev

ENV NODE_ENV=production

EXPOSE 3001

CMD ["node", "dist/server.js"]
