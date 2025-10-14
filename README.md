# yt-dlp-api

A simple REST API for [yt-dlp](https://github.com/yt-dlp/yt-dlp). You can call this API directly from your browser’s address bar as well as via curl.

## Installation
Create a file containing this:
```yaml
services:
  yt-dlp-api:
    image: ghcr.io/ungaul/yt-dlp-api:latest
    ports:
      - "5012:5012"
    restart: unless-stopped
```
Save as `docker-compose.yml`, then from the contaning folder:
```bash
docker compose up -d
```

## Usage
|Purpose|Endpoint|Parameters|Example
|-|-|-|-
|Get the audio/video file|`/download`|`format` (optional, mp3/mp4); `cookies` (optional, percent-encoded Netscape format)|http://localhost:5012/download?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ&format=mp3
|Get the formats available for this audio/video|`/formats`|-|http://localhost:5012/info?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ
|Get metadata|`/info`|-|http://localhost:5012/formats?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ

# To do
- Extension that will copy the current URL to launch the download
- Logging
- Option to add a fixed cookie file