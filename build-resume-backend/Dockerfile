# Use official Node.js image
FROM node:22.14

# Install required dependencies for Chromium
RUN apt-get update && apt-get install -y \
  wget \
  curl \
  unzip \
  fonts-liberation \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdbus-1-3 \
  libdrm2 \
  libgbm1 \
  libnspr4 \
  libnss3 \
  libx11-xcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  xdg-utils \
  && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Set environment variable to avoid installing Chromium (we will use system-installed version)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Install Chromium manually
RUN apt-get update && apt-get install -y chromium
EXPOSE 3000
# Start application
CMD ["node", "index.js"]
