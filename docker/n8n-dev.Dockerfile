FROM n8nio/n8n:latest

# Custom nodes are mounted as a volume at runtime
# This Dockerfile exists for when we need to bake custom nodes into the image
# For dev, use docker-compose.yml with volume mounts

USER node
WORKDIR /home/node

# Default: use the official image as-is
# Custom nodes are mounted via docker-compose volume
CMD ["n8n", "start"]
