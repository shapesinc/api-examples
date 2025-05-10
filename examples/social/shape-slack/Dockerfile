# Use Python 3.11 as the base image
FROM python:3.11

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=3000

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    curl \
    && apt-get clean

# Install Doppler using the install script
RUN curl -Ls --tlsv1.2 --proto "=https" --retry 3 https://cli.doppler.com/install.sh | sh


# Copy project files
COPY . /app/

# Install Python dependencies
# Using pip to install the project as a package
RUN pip install --no-cache-dir .

# Make the entrypoint script executable
RUN chmod +x /app/entrypoint.sh

# Set the entrypoint to the startup script
ENTRYPOINT ["/app/entrypoint.sh"]