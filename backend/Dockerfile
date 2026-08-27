# ── Stage 1: dependency install ────────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /install

# System libs needed to build/run the heavy deps
RUN apt-get update && apt-get install -y --no-install-recommends \
        gcc \
        libglib2.0-0 \
        libgl1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install CPU-only PyTorch first (avoids pulling the 2 GB CUDA wheels).
# Then install the rest of the deps.
RUN pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir \
        torch==2.3.1+cpu \
        torchvision==0.18.1+cpu \
        --extra-index-url https://download.pytorch.org/whl/cpu \
 && pip install --no-cache-dir -r requirements.txt

# ── Stage 2: runtime image ──────────────────────────────────────────────────
FROM python:3.11-slim

# Runtime system libs only (no compiler toolchain)
RUN apt-get update && apt-get install -y --no-install-recommends \
        libglib2.0-0 \
        libgl1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application source
COPY . .

ENV PORT=3000
EXPOSE 3000

# Railway injects PORT at runtime.  Use it instead of pinning Uvicorn to the
# Dockerfile default so the public-networking port and the application agree.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-3000}"]
