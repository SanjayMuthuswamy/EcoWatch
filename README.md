# 🌿 EcoWatch AI — Environmental Threat Detection Platform

> An open-source, AI-powered PoC for real-time wildfire risk scoring, flood forecasting, and deforestation monitoring — built with lightweight ML models, free data sources, and a beautiful Leaflet.js dashboard.

---

## 📦 Project Structure

```
EcoWatch/
├── modules/
│   ├── wildfire/
│   │   ├── ndvi_calculator.py      # NDVI from satellite bands
│   │   ├── risk_scorer.py          # U-Net fire risk model (0–100)
│   │   └── sample_data/            # Synthetic GeoTIFF / numpy arrays
│   ├── floodcast/
│   │   ├── weather_fetcher.py      # Open-Meteo API + synthetic fallback
│   │   ├── lstm_model.py           # LSTM flood prediction (PyTorch)
│   │   └── flood_mapper.py         # 48 h / 72 h probability map + chart
│   └── forestguard/
│       ├── change_detector.py      # CNN NDVI change detection (2022→2024)
│       └── carbon_estimator.py     # Deforestation → CO₂ tonnes (IPCC)
├── dashboard/
│   ├── app.py                      # Flask backend (REST API)
│   └── templates/
│       └── index.html              # Leaflet.js dark-theme dashboard
├── alerts/
│   └── telegram_bot.py             # Telegram alert bot
├── requirements.txt
├── README.md
└── DEMO.md
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- pip

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Run Individual Modules

```bash
# WildfireScan
cd modules/wildfire && python risk_scorer.py

# FloodCast
cd modules/floodcast && python flood_mapper.py

# ForestGuard
cd modules/forestguard && python change_detector.py
cd modules/forestguard && python carbon_estimator.py
```

### 3. Launch the Dashboard

```bash
cd dashboard
python app.py
```

Then open **http://localhost:5000** in your browser.

### 4. Start the Telegram Alert Bot (Optional)

```bash
# 1. Set your Telegram credentials
export TELEGRAM_BOT_TOKEN="your_token"
export TELEGRAM_CHAT_ID="your_chat_id"

# 2. Run the bot (polls every 60 s)
cd alerts
python telegram_bot.py

# Or run once for testing (DEMO mode works without a token)
python telegram_bot.py --once
```

---

## 🔥 Module 1 — WildfireScan

| File | Description |
|------|-------------|
| `ndvi_calculator.py` | Computes NDVI from NIR + Red satellite bands; classifies risk |
| `risk_scorer.py` | Trains a U-Net-inspired CNN on synthetic multi-band data; outputs pixel-wise fire risk map |

**Data source**: Synthetic Landsat-like bands (free fallback). Drop in real GeoTIFFs from [USGS EarthExplorer](https://earthexplorer.usgs.gov/) for production use.

---

## 🌊 Module 2 — FloodCast

| File | Description |
|------|-------------|
| `weather_fetcher.py` | Fetches precipitation, soil moisture, river discharge from [Open-Meteo](https://open-meteo.com/) with synthetic fallback |
| `lstm_model.py` | Single-layer LSTM trained on weather sequence data to predict flood probability |
| `flood_mapper.py` | Generates 48 h / 72 h probability charts; exports JSON + PNG |

---

## 🌳 Module 3 — ForestGuard

| File | Description |
|------|-------------|
| `change_detector.py` | U-Net CNN comparing 2022 vs. 2024 synthetic NDVI scenes; outputs deforestation probability map |
| `carbon_estimator.py` | Converts deforested pixels → hectares → CO₂ equivalent using IPCC Tier 1 carbon density factors |

**Biomes supported**: Tropical Rainforest, Temperate Mixed Forest, Boreal Forest, Dry Tropical.

---

## 🗺️ Dashboard Features

- **Dark-theme Leaflet.js map** with OpenStreetMap tiles
- **Live hotspot markers** colour-coded by dominant threat (fire / flood / deforestation)
- **Sidebar**: Module tabs, global summary stats, 24-hour flood probability chart, clickable hotspot list
- **HUD cards**: Real-time max fire risk, flood probability, CO₂e released
- **Popup tooltips**: Per-region breakdown of all three threat scores
- **Auto-refresh** every 60 seconds

---

## 🤖 Telegram Alert Bot

Sends formatted Markdown alerts when:
- Fire risk > 65%
- Flood probability > 70%
- Deforestation > 10%

Run without a token (DEMO mode) to see console output without sending real messages.

---

## 📋 Requirements

See `requirements.txt`. Key packages:

| Package | Version | Purpose |
|---------|---------|---------|
| flask | ≥2.3 | Dashboard backend |
| torch | ≥2.0 | CNN + LSTM models |
| numpy | ≥1.24 | Array operations |
| pandas | ≥2.0 | Time-series data |
| matplotlib | ≥3.7 | Charts & visualisations |
| requests | ≥2.31 | Open-Meteo API |
| rasterio | ≥1.3 | GeoTIFF I/O (optional) |

---

## 🔑 Free Data Sources

| Source | Data | URL |
|--------|------|-----|
| Open-Meteo | Weather / NDVI / hydrology | https://open-meteo.com |
| USGS EarthExplorer | Landsat satellite imagery | https://earthexplorer.usgs.gov |
| Copernicus Open Access Hub | Sentinel-2 imagery | https://scihub.copernicus.eu |
| Global Forest Watch | Deforestation data | https://globalforestwatch.org |

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

*Built with ❤️ for the environment.*
