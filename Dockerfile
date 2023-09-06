FROM node:lts-alpine

RUN corepack enable

WORKDIR /app

RUN apk update && \
    apk add --update --no-cache curl udev ttf-freefont chromium ffmpeg xvfb && \
    rm /var/cache/apk/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV PUPPETEER_EXECUTABLE_PATH /usr/bin/chromium-browser
