FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV PORT=3000
ENV NEXT_PUBLIC_STT_WS_URL=ws://localhost:8765
EXPOSE 3000
RUN npm run build
CMD ["sh", "-c", "npm run start"]
