# Use an official Node.js image as the base
FROM node:18

# Set the working directory
WORKDIR /app

# Copy package files to install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the app source code into the image
COPY . .

# Build the React app
RUN npm run build

# Expose the UI port
EXPOSE 3000

# Serve the app using a lightweight HTTP server
CMD ["npx", "serve", "-s", "dist", "-l", "3000"]
