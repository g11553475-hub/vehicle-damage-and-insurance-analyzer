FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package.json ./
COPY server.js app.js index.html styles.css ./
EXPOSE 3000
CMD ["npm", "start"]
