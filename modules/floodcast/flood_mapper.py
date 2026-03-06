"""
flood_mapper.py — FloodCast Module
=====================================
Main entry point for the FloodCast module.

Orchestrates: weather fetch → LSTM prediction → visual flood probability chart.

Output:
  - 48h and 72h flood probability percentages
  - flood_forecast.png — time-series chart of hourly flood probabilities
"""

import sys
import numpy as np
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend for server environments
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from pathlib import Path
from datetime import datetime, timedelta

# Local imports
sys.path.insert(0, str(Path(__file__).parent))
from weather_fetcher import fetch_weather_data, extract_features, get_weather_summary
from lstm_model import build_and_train_model, predict_flood_probability


def plot_flood_forecast(hourly_probs: list, weather_data: dict,
                        prob_48h: float, prob_72h: float,
                        output_path: str = None) -> str:
    """
    Create a professional flood forecast chart showing:
      - Hourly flood probability curve with risk zone shading
      - 48h and 72h probability reference lines
      - Precipitation bar chart on secondary axis

    Args:
        hourly_probs: List of flood probabilities per hour (%)
        weather_data: Raw weather data dict for precipitation overlay
        prob_48h:     48-hour flood probability (%)
        prob_72h:     72-hour flood probability (%)
        output_path:  PNG file path (default: floodcast/flood_forecast.png)

    Returns:
        Path to saved PNG file
    """
    if output_path is None:
        output_path = str(Path(__file__).parent / "flood_forecast.png")

    # Build time axis
    start = datetime.now().replace(minute=0, second=0, microsecond=0)
    n = len(hourly_probs)
    times = [start + timedelta(hours=i) for i in range(n)]

    # Get precipitation data for overlay
    precip = np.array(weather_data["hourly"]["precipitation"][:n], dtype=np.float32)

    # ── Figure Setup ──────────────────────────────────────────────────────────
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(14, 8), gridspec_kw={"height_ratios": [3, 1]})
    fig.patch.set_facecolor("#0d1117")
    for ax in [ax1, ax2]:
        ax.set_facecolor("#161b22")
        ax.tick_params(colors="#c9d1d9")
        ax.spines[:].set_color("#30363d")

    # ── Top Panel: Flood Probability ──────────────────────────────────────────
    probs = np.array(hourly_probs, dtype=np.float32)

    # Shaded risk zones
    ax1.axhspan(0, 30, alpha=0.08, color="#00ff88", label="_nolegend_")
    ax1.axhspan(30, 60, alpha=0.08, color="#ffcc00", label="_nolegend_")
    ax1.axhspan(60, 100, alpha=0.10, color="#ff4444", label="_nolegend_")

    # Risk threshold lines
    ax1.axhline(30, color="#ffcc00", linewidth=0.8, linestyle="--", alpha=0.6)
    ax1.axhline(60, color="#ff4444", linewidth=0.8, linestyle="--", alpha=0.6)

    # Gradient fill under probability curve
    ax1.fill_between(times, probs, alpha=0.25, color="#00aaff")
    ax1.plot(times, probs, color="#00aaff", linewidth=2.0, label="Flood Probability")

    # Mark 48h and 72h forecast points
    if len(times) > 48:
        ax1.axvline(times[24], color="#ffcc00", linewidth=1.5, linestyle=":", alpha=0.9)
        ax1.annotate(f"48h: {prob_48h:.0f}%",
                     xy=(times[24], prob_48h),
                     xytext=(10, 10), textcoords="offset points",
                     color="#ffcc00", fontsize=9, fontweight="bold")
    if len(times) > 48:
        ax1.axvline(times[48], color="#ff6644", linewidth=1.5, linestyle=":", alpha=0.9)
        ax1.annotate(f"72h: {prob_72h:.0f}%",
                     xy=(times[min(48, len(times)-1)], prob_72h),
                     xytext=(10, -20), textcoords="offset points",
                     color="#ff6644", fontsize=9, fontweight="bold")

    ax1.set_title("EcoWatch AI — FloodCast 72-Hour Forecast | India Focus",
                  color="#e6edf3", fontsize=13, fontweight="bold", pad=12)
    ax1.set_ylabel("Flood Probability (%)", color="#c9d1d9", fontsize=10)
    ax1.set_ylim(0, 105)
    ax1.set_xlim(times[0], times[-1])
    ax1.xaxis.set_major_formatter(mdates.DateFormatter("%d %b\n%H:%M"))
    ax1.xaxis.set_major_locator(mdates.HourLocator(interval=12))
    ax1.legend(loc="upper left", facecolor="#21262d", edgecolor="#30363d",
               labelcolor="#c9d1d9")

    # Risk level annotations on right axis
    ax1_r = ax1.twinx()
    ax1_r.set_ylim(0, 105)
    ax1_r.set_yticks([15, 45, 80])
    ax1_r.set_yticklabels(["LOW", "MODERATE", "HIGH"], color="#c9d1d9", fontsize=8)
    ax1_r.spines[:].set_color("#30363d")
    ax1_r.tick_params(colors="#c9d1d9")

    # ── Bottom Panel: Precipitation bars ──────────────────────────────────────
    ax2.bar(times, precip, width=0.04, color="#4488ff", alpha=0.7, label="Precipitation (mm/hr)")
    ax2.set_ylabel("Precip (mm/hr)", color="#c9d1d9", fontsize=9)
    ax2.set_xlim(times[0], times[-1])
    ax2.xaxis.set_major_formatter(mdates.DateFormatter("%d %b"))
    ax2.xaxis.set_major_locator(mdates.HourLocator(interval=12))
    ax2.legend(loc="upper left", facecolor="#21262d", edgecolor="#30363d",
               labelcolor="#c9d1d9", fontsize=8)

    plt.tight_layout(h_pad=1.5)
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path, dpi=130, bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close()
    print(f"[Output] Flood forecast chart saved → {output_path}")
    return output_path


def run_floodcast(lat: float = 13.08, lon: float = 80.27) -> dict:
    """
    Main entry point for the FloodCast module.

    Orchestrates: weather fetch → LSTM training → prediction → visualization.

    Args:
        lat: Latitude (default: Chennai 13.08°N)
        lon: Longitude (default: Chennai 80.27°E)

    Returns:
        dict with keys: prob_48h, prob_72h, risk_level, weather_summary, output_image
    """
    print("\n" + "=" * 60)
    print("  EcoWatch AI — FloodCast Module")
    print("=" * 60)

    # Step 1: Fetch weather data (with API fallback)
    from weather_fetcher import fetch_weather_data
    weather_data = fetch_weather_data(lat, lon)

    # Step 2: Build, train model, and predict
    model, features, predictions = build_and_train_model(weather_data)

    prob_48h = predictions["prob_48h"]
    prob_72h = predictions["prob_72h"]

    # Step 3: Determine risk level
    max_prob = max(prob_48h, prob_72h)
    if max_prob >= 70:
        risk_level = "CRITICAL"
    elif max_prob >= 50:
        risk_level = "HIGH"
    elif max_prob >= 30:
        risk_level = "MODERATE"
    else:
        risk_level = "LOW"

    print(f"\n[RESULT] 🌊 Flood Probability (48h): {prob_48h:.1f}% | (72h): {prob_72h:.1f}%")
    print(f"[RESULT] Risk Level: {risk_level}")

    # Step 4: Generate forecast chart
    output_path = str(Path(__file__).parent / "flood_forecast.png")
    plot_flood_forecast(
        predictions["hourly_probs"], weather_data,
        prob_48h, prob_72h, output_path
    )

    # Step 5: Weather summary
    weather_summary = get_weather_summary(weather_data)

    return {
        "prob_48h": prob_48h,
        "prob_72h": prob_72h,
        "risk_level": risk_level,
        "weather_summary": weather_summary,
        "output_image": output_path,
    }


# ── Standalone execution ─────────────────────────────────────────────────────
if __name__ == "__main__":
    result = run_floodcast()
    print(f"\n[Summary]")
    print(f"  Flood Probability 48h: {result['prob_48h']}%")
    print(f"  Flood Probability 72h: {result['prob_72h']}%")
    print(f"  Risk Level: {result['risk_level']}")
    print(f"  Image: {result['output_image']}")
