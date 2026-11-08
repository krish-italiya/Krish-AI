# Stage 1: Build the React + Vite + Tailwind v4 Frontend
FROM node:22-slim AS ui-builder
WORKDIR /app/ui
COPY ui/package*.json ./
RUN npm ci
COPY ui/ ./
RUN npm run build

# Stage 2: Run the FastAPI + Groq Backend & Serve Built UI
FROM python:3.12-slim
WORKDIR /app

# Install Python dependencies
COPY pyproject.toml ./
RUN pip install --no-cache-dir fastapi "uvicorn[standard]" groq pypdf python-dotenv pydantic

# Copy backend source, assets (resume & avatar), and compiled React UI
COPY src/ ./src/
COPY assets/ ./assets/
COPY --from=ui-builder /app/ui/dist ./ui/dist

EXPOSE 7860
CMD ["sh", "-c", "uvicorn my_ai.main:app --app-dir src --host 0.0.0.0 --port ${PORT:-7860}"]