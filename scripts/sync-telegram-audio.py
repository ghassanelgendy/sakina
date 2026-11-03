#!/usr/bin/env python3
"""
Sakina Audio Sync Tool
Pulls publicly previewable audio metadata from Telegram channels
(@podcast1110, @El_minshawy, @menshawy_abdo_elsayed)
and generates/updates the audio catalog without downloading files locally.
"""

import urllib.request
import urllib.parse
import json
import re
import sys
from pathlib import Path

CHANNELS = [
    {
        "username": "El_minshawy",
        "category": "minshawi",
        "categoryLabel": "تراث المنشاوي",
        "defaultSpeaker": "الشيخ محمد صديق المنشاوي",
    },
    {
        "username": "podcast1110",
        "category": "podcasts",
        "categoryLabel": "بودكاست ديني",
        "defaultSpeaker": "بودكاست إيماني",
    },
]

def fetch_channel_preview(username: str) -> str:
    url = f"https://t.me/s/{username}"
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.read().decode("utf-8", errors="ignore")
    except Exception as e:
        print(f"[-] Error fetching @{username}: {e}", file=sys.stderr)
        return ""

def parse_audio_items(html: str, config: dict):
    items = []
    # Extract message blocks
    blocks = html.split("tgme_widget_message_wrap")
    for block in blocks[1:]:
        text_matches = re.findall(r'dir=\"auto\">([^<]+)<', block)
        if not text_matches:
            continue
        title = text_matches[0].strip()
        desc = " — ".join(text_matches[1:3]).strip() if len(text_matches) > 1 else ""

        # Extract post id
        post_link = re.search(rf'https://t\.me/{config["username"]}/(\d+)', block)
        post_id = post_link.group(1) if post_link else str(len(items) + 1)

        # Extract audio source if present
        audio_src = re.search(r'<audio[^>]+src=[\"\']([^\"\']+)[\"\']', block)

        if len(title) > 4:
            items.append({
                "id": f"{config['category']}-{config['username']}-{post_id}",
                "title": title,
                "category": config["category"],
                "categoryLabel": config["categoryLabel"],
                "reciterOrSpeaker": config["defaultSpeaker"],
                "description": desc or title,
                "source": f"تليجرام: @{config['username']}",
                "postUrl": f"https://t.me/{config['username']}/{post_id}",
            })
    return items

def main():
    print("[*] Starting Sakina Telegram Audio Sync...")
    all_tracks = []
    for cfg in CHANNELS:
        print(f"[+] Scraping @{cfg['username']}...")
        html = fetch_channel_preview(cfg["username"])
        if html:
            tracks = parse_audio_items(html, cfg)
            print(f"    Found {len(tracks)} items from @{cfg['username']}.")
            all_tracks.extend(tracks)

    out_file = Path(__file__).resolve().parent.parent / "src" / "data" / "telegramSync.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(all_tracks, f, ensure_ascii=False, indent=2)

    print(f"[✓] Saved {len(all_tracks)} synced items to {out_file}")

if __name__ == "__main__":
    main()
