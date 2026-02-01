from flask import Flask, request, jsonify, send_file
import yt_dlp
import os
import tempfile
import glob
from yt_dlp.utils import DownloadError
import re

app = Flask(__name__)

@app.route('/', methods=['GET'])
def index():
    endpoint_details = {}
    for rule in app.url_map.iter_rules():
        if rule.endpoint == 'static':
            continue
        methods = ','.join(sorted(rule.methods - {'HEAD', 'OPTIONS'}))
        endpoint_details[str(rule.rule)] = methods

    return jsonify({
        'message': 'yt-dlp-api available endpoints',
        'source': 'https://github.com/ungaul/yt-dlp-api',
        'endpoints': endpoint_details
    })

@app.route('/info', methods=['GET', 'POST'])
def info():
    if request.method == 'POST':
        url = request.json.get('url')
    else:
        url = request.args.get('url')
    if not url:
        return jsonify({'error': 'URL is required'}), 400
    try:
        with yt_dlp.YoutubeDL({'quiet': True}) as ydl:
            info = ydl.extract_info(url, download=False)
        return jsonify({
            'id': info.get('id'),
            'title': info.get('title'),
            'uploader': info.get('uploader'),
            'duration': info.get('duration'),
            'webpage_url': info.get('webpage_url'),
            'description': info.get('description'),
            'thumbnail': info.get('thumbnail'),
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/formats', methods=['GET', 'POST'])
def formats():
    if request.method == 'POST':
        url = request.json.get('url')
    else:
        url = request.args.get('url')
    if not url:
        return jsonify({'error': 'URL is required'}), 400
    try:
        with yt_dlp.YoutubeDL({'quiet': True}) as ydl:
            info = ydl.extract_info(url, download=False)
        formats = [{
            'format_id': f.get('format_id'),
            'format_note': f.get('format_note'),
            'ext': f.get('ext'),
            'filesize': f.get('filesize'),
            'fps': f.get('fps'),
            'vcodec': f.get('vcodec'),
            'acodec': f.get('acodec')
        } for f in info.get('formats', [])]
        return jsonify({'formats': formats})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/download', methods=['GET', 'POST'])
def download():
    if request.method == 'POST':
        url = request.json.get('url')
        format_type = request.json.get('format', 'mp4')
        quality = request.json.get('quality')
        cookies_raw = request.json.get('cookies')
    else:
        url = request.args.get('url')
        format_type = request.args.get('format', 'mp4')
        quality = request.args.get('quality')
        cookies_raw = request.args.get('cookies')

    if not url:
        return jsonify({'error': 'URL query parameter is required'}), 400

    if quality:
        if not re.fullmatch(r'\d+p', quality):
            return jsonify({'error': 'Unavailable quality.'}), 400
        height = int(quality[:-1])
    else:
        height = None

    with tempfile.TemporaryDirectory() as tmpdir:
        cookies_file = None
        if cookies_raw:
            cookies_file = os.path.join(tmpdir, "cookies.txt")
            with open(cookies_file, "w") as f:
                f.write(cookies_raw)
        else:
            fixed_cookies_path = "/app/yt_cookies.txt"
            if os.path.isfile(fixed_cookies_path):
                cookies_file = fixed_cookies_path

        if format_type == 'mp3':
            ydl_opts = {
                'format': 'bestaudio',
                'outtmpl': os.path.join(tmpdir, '%(title)s.%(ext)s'),
                'quiet': True,
                'noprogress': True,
                'nooverwrites': True,
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '192',
                }],
            }
        else:
            if height:
               format_str = f'(bestvideo[ext=mp4][height={height}]+bestaudio[ext=m4a]/best[ext=mp4][height={height}])'
            else:
                format_str = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]'

            ydl_opts = {
                'format': format_str,
                'outtmpl': os.path.join(tmpdir, '%(title)s.%(ext)s'),
                'quiet': True,
            }

        if cookies_file:
            ydl_opts['cookiefile'] = cookies_file
            
        ydl_opts['jsruntimes'] = 'deno'
        ydl_opts['remote_components'] = 'ejs:github'

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.extract_info(url, download=True)

            files = glob.glob(os.path.join(tmpdir, '*'))
            if not files:
                return jsonify({'error': 'Downloaded file not found'}), 500
            filepath = files[0]

            return send_file(
                filepath,
                as_attachment=True,
                download_name=os.path.basename(filepath)
            )
        except DownloadError as e:
            return jsonify({'error': 'Download error: ' + str(e)}), 500
        except Exception as e:
            return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5012)