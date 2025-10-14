# yt-dlp-api

A simple REST API for [yt-dlp](https://github.com/yt-dlp/yt-dlp). You can call this API directly from your browser’s address bar as well as via curl.

## Installation
Create a file containing this:
```yaml
services:
  yt-dlp-api:
    image: ghcr.io/ungaul/yt-dlp-api:latest
    container_name: yt-dlp-api
    ports:
      - "5012:5012"
    restart: unless-stopped
    environment:
      - YOUTUBE_COOKIE=""
```
Save as `docker-compose.yml`, then from the contaning folder:
```bash
docker compose up -d
```

## Usage
|Purpose|Endpoint|Parameters|Example
|-|-|-|-
|Get the audio/video file|`/download`|`format` (optional, `mp3`/`mp4`); `cookies` (optional, see below)|http://localhost:5012/download?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ&format=mp3
|Get the formats available for this audio/video|`/formats`|-|http://localhost:5012/info?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ
|Get metadata|`/info`|-|http://localhost:5012/formats?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ


### Cookie file
You should use a cookie file to avoid being flagged as bot. You can obtain it by using [Cookie-Editor](https://addons.mozilla.org/en-US/firefox/addon/cookie-editor/), going to YouTube, downloading the cookie in Netscape format, [percent-encoding](https://www.url-encode-decode.com/) it, and adding the value as environment variable with the name `YOUTUBE_COOKIE`.
> Caution: It is highly recommended NOT to add this cookie in a public environment, as mass-downloading may make your YouTube account banned. 

# To do
- Extension that will copy the current URL to launch the download