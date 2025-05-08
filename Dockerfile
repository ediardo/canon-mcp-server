FROM node:20

# Create app directory
WORKDIR /app

# Copy files
COPY . .

# Install dependencies
RUN npm install

# Expose port
EXPOSE 8080

# Run the server
CMD ["node", "build/live.js"]
