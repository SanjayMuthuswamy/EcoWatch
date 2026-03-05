# 🌿 EcoWatch AI — Demo Walkthrough

This guide walks you through a complete end-to-end demonstration of the EcoWatch AI platform.

---

## Prerequisites

```bash
pip install -r requirements.txt
```

---

## Step 1 — WildfireScan

```bash
cd modules/wildfire
python risk_scorer.py
```

**What happens:**
1. Generates 200 synthetic multi-band satellite scenes (NIR, Red, NDVI)
2. Trains a U-Net CNN for 10 epochs (~30 seconds on CPU)
3. Runs inference on a sample scene
4. Saves `wildfire_risk_map.png` and `fire_risk_summary.json` to `outputs/`

**Expected output:**
```
=======================================================
  WildfireScan — Fire Risk Scorer
=======================================================
[1/4] Generating synthetic satellite dataset …
       Dataset: 200 samples (64×64 px each)
[2/4] Training U-Net …
  Epoch [01/10] — Loss: 0.xxxx
  ...
[3/4] Running inference …
       Mean fire risk : xx.xx%
       Max fire risk  : xx.xx%
[4/4] Saving outputs …
✅  WildfireScan complete.
```

---

## Step 2 — FloodCast

```bash
cd modules/floodcast
python flood_mapper.py
```

**What happens:**
1. Fetches 90 days of weather data from Open-Meteo API (or uses synthetic fallback)
2. Trains an LSTM model on sliding-window sequences
3. Predicts 24-hour flood probability
4. saves `flood_probability_chart.png` and `flood_forecast.json`

**Expected output:**
```
=======================================================
  FloodCast — Flood Probability Mapper
=======================================================
[1/4] Fetching weather data …
[2/4] Training LSTM model …
[3/4] Predicting flood probability …
       Peak probability: xx.xx%   Alert: LOW/MEDIUM/HIGH
[4/4] Saving flood map …
✅  FloodCast complete.
```

---

## Step 3 — ForestGuard: Change Detection

```bash
cd modules/forestguard
python change_detector.py
```

**What happens:**
1. Generates paired 2022 / 2024 synthetic NDVI scenes with realistic deforestation patches
2. Trains a U-Net CNN change detector for 10 epochs
3. Runs pixel-wise change detection on a sample scene pair
4. Saves `change_map.png` (side-by-side 2022 | 2024 | Deforestation Map)

---

## Step 4 — ForestGuard: Carbon Estimation

```bash
cd modules/forestguard
python carbon_estimator.py
```

**What happens:**
1. Uses a synthetic binary deforestation mask (or output from Step 3)
2. Converts deforested pixels → hectares (30 m resolution)
3. Applies IPCC Tier 1 carbon density factors for tropical rainforest
4. Saves `carbon_breakdown.png` and `biome_comparison.png`

**Expected output:**
```
  Deforested area       : x.xxxx ha
  Total carbon released : xxx.xx tC
  CO₂ equivalent        : xxx.xx tCO₂e
  ≈ xxx cars driven for 1 year
```

---

## Step 5 — Full Dashboard

```bash
cd dashboard
python app.py
```

Then open **http://localhost:5000**

**What you see:**

| UI Element | Description |
|------------|-------------|
| 🗺️ Dark Leaflet map | 8 global hotspot markers, colour-coded by threat level |
| 🔥 Red markers | High wildfire risk (>65%) |
| 🌊 Blue markers | High flood probability (>70%) |
| 🌳 Green markers | Deforestation detected |
| 📊 Sidebar chart | 24-hour flood probability across all regions |
| 📋 Hotspot list | Click any region to fly the map to it |
| HUD cards | Live max fire risk, flood probability, CO₂e released |

**API endpoints to test in browser:**

```
http://localhost:5000/api/status
http://localhost:5000/api/all_threats
http://localhost:5000/api/wildfire?lat=37.77&lon=-122.41
http://localhost:5000/api/floodcast?lat=25.20&lon=55.27
http://localhost:5000/api/forestguard?lat=-3.46&lon=-62.21&biome=tropical_rainforest
```

---

## Step 6 — Telegram Alert Bot (Optional)

**With a real Telegram bot:**
```bash
export TELEGRAM_BOT_TOKEN="your_token"
export TELEGRAM_CHAT_ID="your_chat_id"
cd alerts && python telegram_bot.py
```

**Demo mode (no token required — prints to console):**
```bash
cd alerts && python telegram_bot.py --once
```

**Expected demo output:**
```
[DEMO] Would send Telegram message:
🔥 *WILDFIRE ALERT — HIGH*
━━━━━━━━━━━━━━━━━━━━
📍 *Region:* San Francisco Bay
📊 *Fire Risk:* `82.3%`
...
```

---

## Expected File Outputs

After running all modules and the dashboard:

```
modules/wildfire/outputs/
  ├── wildfire_risk_map.png
  └── fire_risk_summary.json

modules/floodcast/outputs/
  ├── flood_probability_chart.png
  └── flood_forecast.json

modules/forestguard/outputs/
  ├── change_map.png
  ├── change_detection_summary.json
  ├── carbon_breakdown.png
  ├── biome_comparison.png
  └── carbon_summary.json
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `ModuleNotFoundError: torch` | Run `pip install torch --index-url https://download.pytorch.org/whl/cpu` |
| `ModuleNotFoundError: flask` | Run `pip install flask` |
| Open-Meteo API timeout | The weather fetcher automatically falls back to synthetic data |
| Port 5000 already in use | Edit `app.py` and change `port=5000` to `port=5001` |
| Telegram bot not sending | Make sure the dashboard is running at `http://localhost:5000` first |

---

*EcoWatch AI — Protecting the Planet with Data* 🌍
