# Step 1: Build frontend
FROM node:18 AS build

WORKDIR /app

COPY frontend ./frontend
WORKDIR /app/frontend
RUN npm install
RUN npm run build

# Step 2: Final image
FROM node:20

WORKDIR /app

# Install Typesense
RUN apt-get update && apt-get install -y wget unzip \
    && wget https://dl.typesense.org/releases/0.25.2/typesense-server-0.25.2-linux-amd64.tar.gz \
    && tar -xzf typesense-server-0.25.2-linux-amd64.tar.gz \
    && mv typesense-server /usr/bin/typesense-server

# Copy backend
COPY backend ./backend

# Copy frontend build
COPY --from=build /app/frontend/dist ./frontend/build

WORKDIR /app/backend
RUN npm install

# Create data dir for Typesense
RUN mkdir -p /data

EXPOSE 5000 8108

# Start BOTH Typesense + Node
CMD sh -c "typesense-server --data-dir /data --api-key=xyz --enable-cors & sleep 5 && node server.js"