FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["sh", "-c", "mkdir -p uploads/dogs/photos uploads/dogs/documents uploads/dogs/temp && node -e \"require('./dist/data-source').AppDataSource.initialize().then(ds => ds.runMigrations()).then(() => { console.log('Migrations complete'); process.exit(0); }).catch(err => { console.error('Migration failed', err); process.exit(1); })\" && node dist/main"]
