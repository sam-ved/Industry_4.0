# backend/Dockerfile
FROM python:3.10-slim

# Install system dependencies (for OpenCV, YOLO, etc.)
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    redis-tools \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY ./backend /app/backend

# Need to copy everything or just backend? We copy the backend directory.
# But main.py uses sys.path.insert(0, ...) so it expects backend to be a subpackage.
# In docker-compose we map volumes. So working dir should be /app

EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
