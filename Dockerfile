# Stage 1: Build the React frontend
FROM node:20-slim AS client-builder
WORKDIR /app/client
# Copy package files first for better caching
COPY client/package*.json ./
RUN npm install
# Copy source and build
COPY client/ ./
RUN npm run build

# Stage 2: Final runtime image
FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim AS runtime
WORKDIR /app

# Install dependencies using uv
COPY server/pyproject.toml server/uv.lock ./
RUN uv sync --frozen --no-dev

# Copy built frontend files to the 'static' directory of the server
COPY --from=client-builder /app/client/dist ./static

# Copy server code
COPY server/app.py ./

# Set environment variables
ENV FLASK_APP=app.py
ENV PYTHONUNBUFFERED=1

# Expose the port Flask runs on
EXPOSE 5000

# Run the application
CMD ["uv", "run", "python", "app.py"]
