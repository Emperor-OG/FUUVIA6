# ---------- FRONTEND BUILD STAGE ----------
FROM node:20 AS frontend-build
WORKDIR /app

# Copy dependency files first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all project files
COPY . .

# Set production mode for Vite
ENV NODE_ENV=production

# Build React/Vite frontend (outputs to /app/dist)
RUN npm run build


# ---------- BACKEND RUNTIME STAGE ----------
FROM node:20 AS backend
WORKDIR /app

# Copy only necessary files for backend
COPY package*.json ./
RUN npm install --omit=dev

# Copy backend source
COPY server ./server

# Copy built frontend from previous stage
COPY --from=frontend-build /app/dist ./client/dist

# (Optional) Copy any shared configs if needed
# COPY .env.production .env  # <- Not needed, use Cloud Run env vars instead

# Set environment to production
ENV NODE_ENV=production

# Expose the port used by Express
EXPOSE 8080

# Start the backend
CMD ["node", "server/server.js"]