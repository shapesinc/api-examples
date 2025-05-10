FROM python:3.12-slim

WORKDIR /app

# Install poetry
RUN pip install poetry==1.8.2

# Copy poetry configuration files
COPY pyproject.toml poetry.lock* ./

# Configure poetry to not use a virtual environment
RUN poetry config virtualenvs.create false

# Regenerate lock file and install dependencies
RUN poetry lock --no-update
RUN poetry install --only main --no-interaction --no-ansi

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

# Set environment variables
ENV PORT=8080
ENV PYTHONUNBUFFERED=1

# Expose the port
EXPOSE 8080

# Make entrypoint script executable
RUN chmod +x /app/entrypoint.sh

# Set the entrypoint to the startup script
ENTRYPOINT ["/app/entrypoint.sh"] 