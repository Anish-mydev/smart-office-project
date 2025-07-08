# Stage 1: Build/Install dependencies
FROM python:3.9 AS builder
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Production image
FROM python:3.9
WORKDIR /app

# Copy the installed dependencies from the builder stage
COPY --from=builder /usr/local/lib/python3.9/site-packages /usr/local/lib/python3.9/site-packages

# Explicitly add the site-packages bin directory to PATH
ENV PATH="/usr/local/lib/python3.9/site-packages/bin:$PATH"

# Copy the application code
COPY ./app /app

EXPOSE 8000

# Run uvicorn server on container start
CMD ["/usr/local/bin/uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
