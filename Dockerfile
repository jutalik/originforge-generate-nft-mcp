# Generated by https://smithery.ai. See: https://smithery.ai/docs/config#dockerfile
FROM node:lts-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./

# Install dependencies without running lifecycle scripts
RUN npm install --ignore-scripts

# Copy the rest of the application code
COPY . .

# Build the project
RUN npm run build

# Expose the port if needed (not strictly required for stdio transport)
# EXPOSE 8080

# Command to run the MCP server
CMD [ "node", "build/index.js" ]
