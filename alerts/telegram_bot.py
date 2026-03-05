"""
EcoWatch AI — Telegram Alert Bot
Sends automated environmental threat alerts to a Telegram chat
whenever WildfireScan, FloodCast, or ForestGuard detects a high-risk event.

Setup:
    1. Create a bot via @BotFather → get your TELEGRAM_BOT_TOKEN
    2. Get your chat ID via @userinfobot → set TELEGRAM_CHAT_ID
    3. Export environment variables OR edit the constants below:
          export TELEGRAM_BOT_TOKEN="your_token"
          export TELEGRAM_CHAT_ID="your_chat_id"
    4. Run:   python telegram_bot.py

Usage (standalone):
    python telegram_bot.py

Usage (import):
    from telegram_bot import send_wildfire_alert, send_flood_alert, send_forest_alert
"""

import os
import json
import time
import sys
import threading
import urllib.request
import urllib.parse
import urllib.error
from datetime import datetime
from typing import Optional

# ─────────────────────────── Configuration ───────────────────────────────────

TELEGRAM_BOT_TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN", "YOUR_BOT_TOKEN_HERE")
TELEGRAM_CHAT_ID: str   = os.getenv("TELEGRAM_CHAT_ID",   "YOUR_CHAT_ID_HERE")

# Thresholds for triggering alerts
FIRE_ALERT_THRESHOLD: float   = 65.0    # Fire risk % above which to alert
FLOOD_ALERT_THRESHOLD: float  = 0.70    # Flood probability above which to alert
FOREST_ALERT_THRESHOLD: float = 10.0   # Deforestation % above which to alert

POLL_INTERVAL_SECONDS: int = 60         # How often to poll the EcoWatch API
ECOWATCH_API_BASE: str = "http://localhost:5000"

DEMO_MODE: bool = (
    TELEGRAM_BOT_TOKEN == "YOUR_BOT_TOKEN_HERE"
    or TELEGRAM_CHAT_ID == "YOUR_CHAT_ID_HERE"
)


# ─────────────────────────── Telegram API Helpers ────────────────────────────

def _telegram_send(method: str, payload: dict) -> Optional[dict]:
    """
    Send a request to the Telegram Bot API.

    Args:
        method:  API method name (e.g. 'sendMessage').
        payload: JSON-serialisable dict of parameters.

    Returns:
        Parsed JSON response dict, or None on failure.
    """
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/{method}"
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url, data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print(f"[TelegramBot] HTTP {e.code}: {e.read().decode()}")
    except Exception as e:
        print(f"[TelegramBot] Error: {e}")
    return None


def send_message(
    text: str,
    parse_mode: str = "Markdown",
    disable_notification: bool = False,
) -> bool:
    """
    Send a text message to the configured Telegram chat.

    Args:
        text:                 Message text (Markdown supported).
        parse_mode:           'Markdown' or 'HTML'.
        disable_notification: If True, send silently.

    Returns:
        True if sent successfully, False otherwise.
    """
    if DEMO_MODE:
        print(f"[DEMO] Would send Telegram message:\n{text}\n{'─'*50}")
        return True

    resp = _telegram_send("sendMessage", {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": text,
        "parse_mode": parse_mode,
        "disable_notification": disable_notification,
    })
    return resp is not None and resp.get("ok", False)


# ─────────────────────────── Alert Formatters ────────────────────────────────

def send_wildfire_alert(
    region: str,
    lat: float,
    lon: float,
    fire_risk_pct: float,
    level: str,
) -> bool:
    """
    Send a wildfire risk alert.

    Args:
        region:        Human-readable region name.
        lat:           Latitude.
        lon:           Longitude.
        fire_risk_pct: Fire risk percentage (0–100).
        level:         Alert level string (LOW/MEDIUM/HIGH/CRITICAL).

    Returns:
        True if message sent successfully.
    """
    emoji = "🔥" if level in ("HIGH", "CRITICAL") else "⚠️"
    msg = (
        f"{emoji} *WILDFIRE ALERT — {level}*\n"
        f"━━━━━━━━━━━━━━━━━━━━\n"
        f"📍 *Region:* {region}\n"
        f"🌐 *Coords:* `{lat:.4f}, {lon:.4f}`\n"
        f"📊 *Fire Risk:* `{fire_risk_pct:.1f}%`\n"
        f"🚨 *Alert Level:* `{level}`\n"
        f"🕐 *Time:* `{datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}`\n\n"
        f"_Action: Deploy ground crews and activate aerial suppression if risk > 80%._"
    )
    print(f"[WildfireScan] Sending alert for {region} — {fire_risk_pct:.1f}%")
    return send_message(msg)


def send_flood_alert(
    region: str,
    lat: float,
    lon: float,
    flood_probability: float,
    level: str,
) -> bool:
    """
    Send a flood probability alert.

    Args:
        region:            Human-readable region name.
        lat:               Latitude.
        lon:               Longitude.
        flood_probability: Flood probability 0.0–1.0.
        level:             Alert level string.

    Returns:
        True if message sent successfully.
    """
    emoji = "🌊" if level in ("HIGH", "CRITICAL") else "⛈️"
    msg = (
        f"{emoji} *FLOOD ALERT — {level}*\n"
        f"━━━━━━━━━━━━━━━━━━━━\n"
        f"📍 *Region:* {region}\n"
        f"🌐 *Coords:* `{lat:.4f}, {lon:.4f}`\n"
        f"📊 *Flood Probability:* `{flood_probability*100:.1f}%`\n"
        f"🚨 *Alert Level:* `{level}`\n"
        f"🕐 *Time:* `{datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}`\n\n"
        f"_Action: Issue evacuation advisory for low-lying areas within 72 hours._"
    )
    print(f"[FloodCast] Sending alert for {region} — {flood_probability*100:.1f}%")
    return send_message(msg)


def send_forest_alert(
    region: str,
    lat: float,
    lon: float,
    deforestation_pct: float,
    co2_equivalent_tonnes: float,
    level: str,
) -> bool:
    """
    Send a deforestation / carbon loss alert.

    Args:
        region:                Human-readable region name.
        lat:                   Latitude.
        lon:                   Longitude.
        deforestation_pct:     Deforested area percentage.
        co2_equivalent_tonnes: Estimated CO₂ equivalent released (tonnes).
        level:                 Alert level string.

    Returns:
        True if message sent successfully.
    """
    emoji = "🌳" if level in ("HIGH", "CRITICAL") else "🪵"
    msg = (
        f"{emoji} *DEFORESTATION ALERT — {level}*\n"
        f"━━━━━━━━━━━━━━━━━━━━\n"
        f"📍 *Region:* {region}\n"
        f"🌐 *Coords:* `{lat:.4f}, {lon:.4f}`\n"
        f"📊 *Deforestation:* `{deforestation_pct:.1f}%`\n"
        f"💨 *CO₂ Released:* `{co2_equivalent_tonnes:.1f} tCO₂e`\n"
        f"🚨 *Alert Level:* `{level}`\n"
        f"🕐 *Time:* `{datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}`\n\n"
        f"_Action: Notify environmental agencies and verify satellite imagery._"
    )
    print(f"[ForestGuard] Sending alert for {region} — {deforestation_pct:.1f}%")
    return send_message(msg)


def send_startup_message() -> bool:
    """Send a startup notification to the Telegram chat."""
    msg = (
        "🌿 *EcoWatch AI — Bot Started*\n"
        f"━━━━━━━━━━━━━━━━━━━━\n"
        f"🕐 `{datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}`\n"
        f"🔄 Polling every `{POLL_INTERVAL_SECONDS}s`\n\n"
        f"Monitoring:\n"
        f"  🔥 Wildfire risk > {FIRE_ALERT_THRESHOLD:.0f}%\n"
        f"  🌊 Flood prob > {FLOOD_ALERT_THRESHOLD*100:.0f}%\n"
        f"  🌳 Deforestation > {FOREST_ALERT_THRESHOLD:.0f}%"
    )
    return send_message(msg)


# ─────────────────────────── Polling Loop ────────────────────────────────────

def _fetch_threats() -> Optional[dict]:
    """
    Fetch latest threat data from the EcoWatch API.

    Returns:
        JSON dict or None on failure.
    """
    url = f"{ECOWATCH_API_BASE}/api/all_threats"
    try:
        with urllib.request.urlopen(url, timeout=10) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"[TelegramBot] Could not reach EcoWatch API: {e}")
        return None


# Track which hotspots have already been alerted (avoid spam)
_alerted_fire:   set = set()
_alerted_flood:  set = set()
_alerted_forest: set = set()


def _check_and_alert(data: dict) -> None:
    """
    Evaluate threat data and send alerts for threshold breaches.

    Args:
        data: JSON dict from /api/all_threats.
    """
    for hs in data.get("hotspots", []):
        region = hs["region"]

        # Wildfire
        wf = hs["wildfire"]
        if wf["fire_risk_pct"] >= FIRE_ALERT_THRESHOLD and region not in _alerted_fire:
            ok = send_wildfire_alert(region, hs["lat"], hs["lon"], wf["fire_risk_pct"], wf["level"])
            if ok:
                _alerted_fire.add(region)
            time.sleep(0.5)

        # Flood
        fl = hs["flood"]
        if fl["probability"] >= FLOOD_ALERT_THRESHOLD and region not in _alerted_flood:
            ok = send_flood_alert(region, hs["lat"], hs["lon"], fl["probability"], fl["level"])
            if ok:
                _alerted_flood.add(region)
            time.sleep(0.5)

        # Forest
        fg = hs["deforestation"]
        if fg["pct"] >= FOREST_ALERT_THRESHOLD and region not in _alerted_forest:
            ok = send_forest_alert(
                region, hs["lat"], hs["lon"],
                fg["pct"], fg["co2_equivalent_tonnes"], fg["level"],
            )
            if ok:
                _alerted_forest.add(region)
            time.sleep(0.5)


def run_alert_bot(once: bool = False) -> None:
    """
    Main polling loop — fetch threats and send Telegram alerts.

    Args:
        once: If True, poll once and exit (useful for testing).
    """
    print("=" * 55)
    print("  EcoWatch AI — Telegram Alert Bot")
    print(f"  Mode: {'DEMO (no real messages)' if DEMO_MODE else 'LIVE'}")
    print("=" * 55)

    if not DEMO_MODE:
        send_startup_message()

    while True:
        print(f"\n[{datetime.utcnow().strftime('%H:%M:%S UTC')}] Polling EcoWatch API …")
        data = _fetch_threats()
        if data:
            _check_and_alert(data)
            print(f"  Checked {len(data.get('hotspots', []))} hotspots. "
                  f"Fire alerts: {len(_alerted_fire)} | "
                  f"Flood: {len(_alerted_flood)} | Forest: {len(_alerted_forest)}")
        else:
            print("  ⚠ No data — is the dashboard running on port 5000?")

        if once:
            break
        print(f"  Next poll in {POLL_INTERVAL_SECONDS}s …")
        time.sleep(POLL_INTERVAL_SECONDS)


# ──────────────────────────── Main ───────────────────────────────────────────

if __name__ == "__main__":
    once_flag = "--once" in sys.argv
    run_alert_bot(once=once_flag)
