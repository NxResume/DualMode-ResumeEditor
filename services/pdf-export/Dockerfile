# Playwright official image includes Chromium + system deps.
# Keep playwright npm version in package.json in sync with the image tag.
FROM mcr.microsoft.com/playwright:v1.50.1-jammy

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3100 \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

COPY package.json ./
RUN npm install --omit=dev

COPY src ./src

# Render Free injects PORT; expose default for local docker run
EXPOSE 3100

USER pwuser

CMD ["node", "src/index.js"]
