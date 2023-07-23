# Stage 1: Build the Angular frontend
FROM node:14.17.6 AS ui-build
WORKDIR /usr/src/app
COPY FE/ ./FE/
RUN cd FE && npm install @angular/cli && npm install && npm run build

# Stage 2: Build the Node.js backend
FROM node:14.17.6 AS server-build
WORKDIR /app/BE
COPY --from=ui-build /usr/src/app/FE/dist/data-metrics ./FE/dist
COPY package*.json ./
RUN npm install
COPY BE ./

EXPOSE 3000

CMD ["node", "server.js"]


# Stage 1: Build the Angular frontend
# FROM node:14.17.6 as angular-builder

# WORKDIR /app/FE
# COPY package.json package-lock.json ./
# RUN npm install
# COPY . .
# RUN npm run build
# ### STAGE 2: Run ###
# FROM nginx:1.21.3-alpine
# COPY nginx.conf /etc/nginx/nginx.conf
# COPY --from=angular-builder /app/FE/dist/data-metrics /usr/share/nginx/html

# # Stage 2: Build the Node.js backend
# FROM node:14.17.6 AS server-build
# WORKDIR /app/BE
# # COPY --from=angular-builder /app/FE/dist/data-metrics ./FE/dist
# COPY package*.json ./
# RUN npm install
# COPY BE ./

# EXPOSE 3000

# CMD ["node", "server.js"]