"""
weather_fetcher.py — FloodCast Module
========================================
Fetches 7-day hourly precipitation and weather data from Open-Meteo API.
No API key required — completely free.

Target Location: Chennai, Tamil Nadu, India
  Latitude:  13.08° N
  Longitude: 80.27° E
"""

import requests
import numpy as np
import json
from datetime import datetime, timedelta
from pathlib import Path


# Default location: Chennai, Tamil Nadu
DEFAULT_LAT = 13.08
DEFAULT_LON = 80.27
DEFAULT_LOCATION = "Chennai, Tamil Nadu"

# Open-Meteo API endpoint (free, no key required)
OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"


def fetch_weather_data(lat: float = DEFAULT_LAT, lon: float = DEFAULT_LON,
                       days: int = 7) -> dict:
    """
    Fetch hourly weather forecast from Open-Meteo API.

    Retrieves:
      - precipitation (mm/hr)
      - precipitation_probability (%)
      - temperature_2m (°C)
      - relative_humidity_2m (%)
      - wind_speed_10m (km/h)

    Args:
        lat:  Latitude of target location
        lon:  Longitude of target location
        days: Number of forecast days (max 16 for free tier)

    Returns:
        dict with 'hourly' key containing time-series data,
        or synthetic fallback if API is unavailable
    """
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": [
            "precipitation",
            "precipitation_probability",
            "temperature_2m",
            "relative_humidity_2m",
            "wind_speed_10m",
        ],
        "forecast_days": days,
        "timezone": "Asia/Kolkata",
    }

    try:
        print(f"[INFO] Fetching weather data from Open-Meteo for ({lat}°N, {lon}°E)...")
        response = requests.get(OPEN_METEO_URL, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        print(f"[INFO] Successfully fetched {len(data['hourly']['time'])} hourly records")
        data["_source"] = "real_api"
        return data

    except requests.exceptions.Timeout:
        print("[WARN] Open-Meteo API timed out — using synthetic weather data")
    except requests.exceptions.ConnectionError:
        print("[WARN] No internet connection — using synthetic weather data")
    except requests.exceptions.HTTPError as e:
        print(f"[WARN] API returned HTTP error {e} — using synthetic weather data")
    except Exception as e:
        print(f"[WARN] Unexpected error fetching weather ({e}) — using synthetic data")

    # Fallback: Generate synthetic weather data
    return generate_synthetic_weather(lat, lon, days)


def generate_synthetic_weather(lat: float = DEFAULT_LAT, lon: float = DEFAULT_LON,
                                days: int = 7) -> dict:
    """
    Generate realistic synthetic hourly weather data for Chennai monsoon season.

    Simulates a scenario with:
      - Heavy rainfall event peaking at hour 48–60 (ideal for flood prediction demo)
      - Realistic temperature and humidity patterns
      - Diurnal variation in all variables

    NOTE: This is SYNTHETIC DATA generated for demonstration purposes.

    Args:
        lat, lon: Location coordinates (kept for metadata)
        days:     Number of forecast days

    Returns:
        dict matching Open-Meteo API response format
    """
    rng = np.random.default_rng(seed=2024)
    n_hours = days * 24

    # Time series (ISO 8601)
    start = datetime.now().replace(minute=0, second=0, microsecond=0)
    times = [(start + timedelta(hours=i)).strftime("%Y-%m-%dT%H:%M") for i in range(n_hours)]

    # ── Precipitation (mm/hr) ──────────────────────────────────────────────
    # Background drizzle
    precip = rng.exponential(0.3, n_hours).clip(0, 2)

    # Simulate a major rainfall event from hour 30 to 78 (classic 2-day storm)
    storm_hours = np.arange(30, min(78, n_hours))
    storm_intensity = np.exp(-0.5 * ((storm_hours - 54) / 12) ** 2)  # Gaussian peak at hr 54
    precip[storm_hours] += storm_intensity * rng.uniform(18, 28, len(storm_hours))

    # Second smaller pulse around hour 100
    if n_hours > 100:
        pulse_hours = np.arange(96, min(120, n_hours))
        precip[pulse_hours] += rng.uniform(0, 8, len(pulse_hours))

    precip = precip.clip(0, 50).round(2)

    # ── Precipitation Probability (%) ──────────────────────────────────────
    prob = np.zeros(n_hours, dtype=np.float32)
    prob[:30] = rng.uniform(10, 35, 30)
    prob[30:78] = rng.uniform(65, 95, 48)
    prob[78:] = rng.uniform(20, 55, n_hours - 78)
    prob = prob.clip(0, 100).round(1)

    # ── Temperature (°C) — Chennai range 24–36°C with diurnal cycle ────────
    hour_of_day = np.arange(n_hours) % 24
    diurnal = 5 * np.sin(np.pi * (hour_of_day - 6) / 12)  # peak at noon
    temp = 30 + diurnal + rng.normal(0, 0.5, n_hours)
    temp = temp.clip(24, 38).round(1)

    # ── Relative Humidity (%) — higher during rain ─────────────────────────
    humidity = 65 + (precip * 0.8).clip(0, 30) + rng.normal(0, 3, n_hours)
    humidity = humidity.clip(40, 98).round(1)

    # ── Wind Speed (km/h) ─────────────────────────────────────────────────
    wind = 12 + rng.exponential(5, n_hours).clip(0, 35)
    wind[30:78] += 10  # stronger winds during storm
    wind = wind.clip(0, 60).round(1)

    print("[INFO] Generated synthetic weather data (Chennai monsoon simulation)")

    return {
        "latitude": lat,
        "longitude": lon,
        "timezone": "Asia/Kolkata",
        "hourly_units": {
            "time": "iso8601",
            "precipitation": "mm",
            "precipitation_probability": "%",
            "temperature_2m": "°C",
            "relative_humidity_2m": "%",
            "wind_speed_10m": "km/h",
        },
        "hourly": {
            "time": times,
            "precipitation": precip.tolist(),
            "precipitation_probability": prob.tolist(),
            "temperature_2m": temp.tolist(),
            "relative_humidity_2m": humidity.tolist(),
            "wind_speed_10m": wind.tolist(),
        },
        "_source": "synthetic",
    }


def extract_features(weather_data: dict, window_hours: int = 72) -> np.ndarray:
    """
    Extract and normalize feature matrix from weather data for LSTM input.

    Features per timestep:
      [precip, precip_norm, precip_prob, temperature, humidity, wind_speed]

    Args:
        weather_data:  Response dict from fetch_weather_data()
        window_hours:  How many hours of data to use

    Returns:
        features: numpy array (T, 6) — T timesteps, 6 features, normalized to [0,1]
    """
    hourly = weather_data["hourly"]
    T = min(window_hours, len(hourly["time"]))

    precip = np.array(hourly["precipitation"][:T], dtype=np.float32)
    prob   = np.array(hourly["precipitation_probability"][:T], dtype=np.float32)
    temp   = np.array(hourly["temperature_2m"][:T], dtype=np.float32)
    humid  = np.array(hourly["relative_humidity_2m"][:T], dtype=np.float32)
    wind   = np.array(hourly["wind_speed_10m"][:T], dtype=np.float32)

    # Cumulative 6-hour rolling precipitation (flood indicator)
    cum_precip_6h = np.convolve(precip, np.ones(6) / 6, mode="same")

    # Normalize each feature to [0, 1]
    def norm(x, x_min=None, x_max=None):
        lo = x_min if x_min is not None else x.min()
        hi = x_max if x_max is not None else x.max()
        return (x - lo) / (hi - lo + 1e-8)

    features = np.stack([
        norm(precip, 0, 50),         # precipitation mm/hr
        norm(cum_precip_6h, 0, 50),  # 6-hr rolling precip
        norm(prob, 0, 100),          # precipitation probability %
        norm(temp, 20, 45),          # temperature °C
        norm(humid, 30, 100),        # relative humidity %
        norm(wind, 0, 60),           # wind speed km/h
    ], axis=1)  # (T, 6)

    return features


def get_weather_summary(weather_data: dict) -> dict:
    """
    Compute a summary of observed weather conditions.

    Args:
        weather_data: Response dict from fetch_weather_data()

    Returns:
        dict with total_precip_mm, max_hourly_precip, avg_humidity, source
    """
    hourly = weather_data["hourly"]
    precip = np.array(hourly["precipitation"])
    humid  = np.array(hourly["relative_humidity_2m"])

    return {
        "source": weather_data.get("_source", "unknown"),
        "total_precip_mm": round(float(precip.sum()), 2),
        "max_hourly_precip_mm": round(float(precip.max()), 2),
        "avg_humidity_pct": round(float(humid.mean()), 1),
        "n_hours": len(hourly["time"]),
    }


# ── Standalone execution ─────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 60)
    print("  EcoWatch AI — FloodCast Weather Fetcher")
    print("=" * 60)

    data = fetch_weather_data()
    summary = get_weather_summary(data)

    print("\n[Weather Summary]")
    for k, v in summary.items():
        print(f"  {k}: {v}")

    features = extract_features(data)
    print(f"\n[Feature Matrix] Shape: {features.shape}")
    print(f"  Feature columns: [precip, cum_precip_6h, prob, temp, humidity, wind]")
