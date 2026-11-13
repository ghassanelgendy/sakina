#!/usr/bin/env python3
"""
Download audio from a Telegram channel (or forwarded audio from Saved Messages)
and make it playable on an old iPhone 4S (iOS 9.3.5, Safari only).

Why Telethon: t.me/s/<channel> (the public web preview) exposes no media URLs,
so files can only be fetched through the Telegram API with your own login.

Setup (once):
  python3 -m venv .venv && . .venv/bin/activate && pip install telethon
  Get api_id / api_hash from https://my.telegram.org -> API development tools
  export TG_API_ID=... TG_API_HASH=...

Usage:
  python tg_audio_fetch.py Qu_Arabia --limit 50          # a channel
  python tg_audio_fetch.py me --limit 100                # Saved Messages (forwarded audio)
  python tg_audio_fetch.py Qu_Arabia --serve 8080        # then open http://<laptop-ip>:8080 on the 4S
  python tg_audio_fetch.py Qu_Arabia --push 192.168.1.106:5005 --playlist "AA - Quran"
      # uploads into the phone's Music library via the on-device ipod_control_server.py API

First run asks for your phone number + login code (interactive).
"""
import argparse, asyncio, uuid, urllib.request, html, http.server, os, socketserver, subprocess, sys
from pathlib import Path
from urllib.parse import quote

OUT = Path(__file__).resolve().parent / "library"


def to_mp3(src: Path) -> Path:
    """iOS 9 can't play ogg/opus (Telegram voice notes), so everything becomes MP3."""
    dst = src.with_suffix(".mp3")
    if src.suffix.lower() == ".mp3":
        return src
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(src),
         "-vn", "-ac", "2", "-b:a", "128k", str(dst)],
        check=True)
    src.unlink()
    return dst


async def fetch(target: str, limit: int):
    from telethon import TelegramClient
    api_id, api_hash = os.environ.get("TG_API_ID"), os.environ.get("TG_API_HASH")
    if not (api_id and api_hash):
        sys.exit("Set TG_API_ID and TG_API_HASH (https://my.telegram.org)")
    folder = OUT / target
    folder.mkdir(parents=True, exist_ok=True)
    async with TelegramClient(str(OUT.parent / ".session"), int(api_id), api_hash) as tg:
        async for msg in tg.iter_messages(target, limit=limit):
            if not (msg.audio or msg.voice):
                continue
            if any(folder.glob(f"{msg.id}_*")):
                continue  # already downloaded
            title = (msg.file.name or msg.text or "audio").strip().split("\n")[0][:60]
            safe = "".join(c for c in title if c.isalnum() or c in " -_.").strip() or "audio"
            ext = msg.file.ext or ".ogg"
            path = Path(await msg.download_media(file=str(folder / f"{msg.id}_{safe}{ext}")))
            print("downloaded", path.name)
            to_mp3(path)


def push(host: str, playlist: str):
    """POST each not-yet-pushed MP3 to the iPhone's ipod_control_server.py /upload."""
    done_file = OUT / ".pushed"
    done = set(done_file.read_text().split("\n")) if done_file.exists() else set()
    for mp3 in sorted(OUT.rglob("*.mp3")):
        key = str(mp3.relative_to(OUT))
        if key in done:
            continue
        b = uuid.uuid4().hex
        parts = []
        if playlist:
            parts.append(f'--{b}\r\nContent-Disposition: form-data; name="playlist"\r\n\r\n{playlist}\r\n'.encode())
        parts.append(f'--{b}\r\nContent-Disposition: form-data; name="file"; filename="{mp3.name}"\r\n'
                     f'Content-Type: audio/mpeg\r\n\r\n'.encode() + mp3.read_bytes() + f'\r\n--{b}--\r\n'.encode())
        req = urllib.request.Request(f"http://{host}/upload", data=b"".join(parts),
                                     headers={"Content-Type": f"multipart/form-data; boundary={b}"})
        try:
            print("pushed", mp3.name, urllib.request.urlopen(req, timeout=120).read().decode())
            done.add(key)
        except Exception as e:
            print("push failed", mp3.name, e)
    done_file.write_text("\n".join(sorted(done)))


def build_index():
    """Plain HTML 4-style page: no JS frameworks, works in iOS 9 Safari."""
    rows = []
    for mp3 in sorted(OUT.rglob("*.mp3"), reverse=True):
        rel = quote(str(mp3.relative_to(OUT)))
        rows.append(f'<p>{html.escape(mp3.stem)}<br>'
                    f'<audio controls preload="none" src="{rel}"></audio></p>')
    (OUT / "index.html").write_text(
        '<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width"><title>Telegram Audio</title></head>'
        '<body style="font-family:sans-serif;margin:12px">' + "\n".join(rows) + "</body></html>",
        encoding="utf-8")


def serve(port: int):
    os.chdir(OUT)
    with socketserver.TCPServer(("", port), http.server.SimpleHTTPRequestHandler) as srv:
        print(f"Serving on port {port} -> open http://<this-machine-ip>:{port} on the iPhone 4S")
        srv.serve_forever()


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("target", help="channel username, or 'me' for Saved Messages")
    ap.add_argument("--limit", type=int, default=50)
    ap.add_argument("--push", metavar="HOST:PORT", help="upload to the iPhone's ipod_control_server.py")
    ap.add_argument("--playlist", default="", help="playlist name for pushed tracks")
    ap.add_argument("--serve", type=int, metavar="PORT")
    a = ap.parse_args()
    asyncio.run(fetch(a.target, a.limit))
    build_index()
    if a.push:
        push(a.push, a.playlist)
    if a.serve:
        serve(a.serve)
