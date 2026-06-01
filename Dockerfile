# Node.js bazaviy tasviri
FROM node:18-alpine

# Ishchi katalog
WORKDIR /app

# Paketlarni ko'chirish
COPY package*.json ./

# Paketlarni o'rnatish
RUN npm install

# Barcha kodni ko'chirish
COPY . .

# Serverni ishga tushirish (Mana shu qator juda muhim!)
CMD ["node", "server.js"]