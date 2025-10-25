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
    volumes:
      - ./yt_cookies.txt:/app/yt_cookies.txt
```
Save as `docker-compose.yml`, then from the contaning folder:
```bash
docker compose up -d
```

## Usage
|Purpose|Endpoint|Parameters|Example
|-|-|-|-
|Get the audio/video file|`/download`|`format` (optional, `mp3`/`mp4`); `cookies` (optional, see below); `quality` (optional, `144p`,`2160p`,etc)|http://localhost:5012/download?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ&format=mp4&quality=360p
|Get the formats available for this audio/video|`/formats`|-|http://localhost:5012/formats?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ
|Get metadata|`/info`|-|http://localhost:5012/info?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ

> Note: sometimes YouTube tries to find ways to block yt-dlp so you may encounter 403: Forbidden for no reason. In that case, simply run `docker exec -it yt-dlp-api pip install -U yt-dlp` to update yt-dlp (as soon as a patch is available)

### Cookie file
You should use a cookie file to avoid being flagged as bot:
- Install [Cookie-Editor](https://addons.mozilla.org/en-US/firefox/addon/cookie-editor/)
- Go to YouTube, then download the cookie in Netscape format
- Type the path of your cookie file in the `docker-compose.yml` by replacing `./yt_cookies.txt` in `- ./yt_cookies.txt:/app/yt_cookies.txt` (eg: /home/ubuntu/yt_cookies.txt)
> Caution: It is highly recommended NOT to add this cookie in a public environment, as mass-downloading may make your YouTube account banned. 

# To do
- Extension that will copy the current URL to launch the download
