# ============================
# 1. Base image
# ============================
FROM python:3.12-slim

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# ============================
# 2. App directory
# ============================
WORKDIR /app

# ============================
# 4) Copy backend & frontend
# ============================
COPY . .

# Make start.sh executable
RUN chmod +x start.sh

# ============================
# 5. Install dependencies
# ============================
# Install uv
RUN pip install uv

# Install Python dependencies
RUN uv sync --frozen

# ============================
# 6. Expose HF Spaces port
# ============================
EXPOSE 7860

# ============================
# 7. Start FastAPI server
# ============================
CMD ["bash", "start.sh"]