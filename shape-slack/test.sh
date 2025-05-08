#!/bin/bash
set -e

# ===== OCI Object Storage Download Section =====
echo "Starting file download from OCI Object Storage..."

# Install OCI CLI if not already installed
if ! command -v oci &> /dev/null; then
    echo "Installing OCI CLI..."
    pip install oci-cli
fi

export DOWNLOAD_DIR="/${APP_DIR}"

# Create download directory if it doesn't exist
mkdir -p $APP_DIR

# List objects with our prefix
echo "Listing objects with prefix: $FILE_PREFIX"
OBJECTS_MAYBE=$(oci os object list --bucket-name $BUCKET_NAME --prefix $FILE_PREFIX --query "data[].name" --raw-output --auth security_token)

# Initialize OBJECTS as an empty array
OBJECTS=()

# Iterate through OBJECTS_MAYBE and only include items with more than 2 characters
for ITEM in $OBJECTS_MAYBE; do
  if [ $(echo -n "$ITEM" | wc -c) -gt 6 ]; then
      ITEM=$(echo "$ITEM" | sed 's/^"//;s/"$//')
      OBJECTS+=("$ITEM")
      echo "Added valid object: $ITEM"
  else
      echo "Skipping short object name: $ITEM"
  fi
done


# Download each object
for OBJECT in $OBJECTS; do

    echo "Downloading: $OBJECT"
    # Extract the filename without the prefix
    FILENAME=$(echo "$OBJECT" | sed "s/$APP_ID//g")
    # Download the file
    # Try to download the file, continue if it fails
    if ! oci os object get --bucket-name $BUCKET_NAME --name "$OBJECT" --file "$FILENAME" --auth security_token; then
        echo "Failed to download $OBJECT, continuing..."
        continue
    fi
    # Use printf to handle any special characters and then pipe to cp
    printf '%s' "$FILENAME" | xargs -I{} cp {} "$APP_DIR/"

done


echo "Download complete! Looking for user entrypoint script..."

# Check if user entrypoint exists and execute it
if [ -f "/app/entrypoint.sh" ]; then
    echo "Found user entrypoint at /app/entrypoint.sh, executing..."
    # Make it executable if it isn't already
    chmod +x /app/entrypoint.sh
    # Execute the user entrypoint script
    exec /app/entrypoint.sh
else
    # Fall back to default command from Dockerfile
    echo "WARNING:No user entrypoint script found at /app/entrypoint.sh, running default container command..."
    exec gunicorn --bind 0.0.0.0:$PORT main:flask_app
fi