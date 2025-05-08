# Use Python 3.11 as the base image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=3000

# Install system dependencies and Doppler
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    curl \
    apt-transport-https \
    ca-certificates \
    gnupg \
    && curl -sLf --retry 3 --tlsv1.2 --proto "=https" 'https://packages.doppler.com/public/cli/gpg.DE2A7741A397C129.key' | apt-key add - \
    && echo "deb https://packages.doppler.com/public/cli/deb/debian any-version main" | tee /etc/apt/sources.list.d/doppler-cli.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends doppler \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy project files
COPY . /app/

# Install Python dependencies
# Using pip to install the project as a package
RUN pip install --no-cache-dir .

# Make the entrypoint script executable
RUN chmod +x /app/entrypoint.sh

# Set the entrypoint to the startup script
ENTRYPOINT ["/app/entrypoint.sh"]