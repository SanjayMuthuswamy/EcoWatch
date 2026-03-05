"""
EcoWatch AI — Flask Dashboard Backend
Serves the Leaflet.js dark-theme dashboard and exposes REST endpoints
for WildfireScan, FloodCast, and ForestGuard modules.

Usage:
    python app.py
    Then open http://localhost:5000 in your browser.
"""

import sys
import os

# ─── Module path setup ────────────────────────────────────────────────────────
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WILDFIRE_PATH  = os.path.join(PROJECT_ROOT, "modules", "wildfire")
FLOODCAST_PATH = os.path.join(PROJECT_ROOT, "modules", "floodcast")
FORESTGUARD_PATH = os.path.join(PROJECT_ROOT, "modules", "forestguard")
for p in [WILDFIRE_PATH, FLOODCAST_PATH, FORESTGUARD_PATH]:
    if p not in sys.path:
        sys.path.insert(0, p)

import json
import numpy as np
from datetime import datetime
from flask import Flask, jsonify, render_template, request, send_from_directory

# ─── Module imports ──────────────────────────────────────────────────────────
try:
    from ndvi_calculator import generate_synthetic_scene, calculate_ndvi, get_ndvi_statistics
    from risk_scorer import (
        MiniUNet, create_training_data, train_model as wf_train_model,
        predict_segmentation, compute_fire_risk_score, run_wildfire_scan,
    )
    WILDFIRE_AVAILABLE = True
except Exception as e:
    print(f"[WARN] WildfireScan import failed: {e}")
    WILDFIRE_AVAILABLE = False

try:
    from weather_fetcher import fetch_weather_data, extract_features
    from lstm_model import (
        FloodLSTM, create_sequences, train_lstm,
        predict_flood_probability, build_and_train_model,
    )
    FLOODCAST_AVAILABLE = True
except Exception as e:
    print(f"[WARN] FloodCast import failed: {e}")
    FLOODCAST_AVAILABLE = False

try:
    from change_detector import (
        generate_ndvi_scene, generate_deforested_scene,
        ChangeDetectorCNN, build_dataset as fg_build_dataset,
        train_model as fg_train_model, detect_changes,
    )
    from carbon_estimator import estimate_from_mask, BIOME_CARBON_DENSITY
    FORESTGUARD_AVAILABLE = True
except Exception as e:
    print(f"[WARN] ForestGuard import failed: {e}")
    FORESTGUARD_AVAILABLE = False

import torch

# ─────────────────────────── Flask App ───────────────────────────────────────

# Update to serve React build
FRONTEND_DIST = os.path.join(PROJECT_ROOT, "frontend", "dist")

app = Flask(__name__, 
            static_folder=os.path.join(FRONTEND_DIST, "assets"),
            template_folder=FRONTEND_DIST)
app.config["JSON_SORT_KEYS"] = False

# In-memory model cache (avoids retraining on every request)
_models: dict = {}


def _get_wildfire_model():
    """Lazy-load and cache the WildfireScan model."""
    if "wildfire" not in _models and WILDFIRE_AVAILABLE:
        print("[INFO] Training WildfireScan model …")
        red, nir, _ = generate_synthetic_scene.__module__ and \
            __import__('ndvi_calculator').get_bands()  # type: ignore
        ndvi = calculate_ndvi(red, nir)
        x_t, y_t = create_training_data(red, nir, ndvi)
        model = MiniUNet()
        wf_train_model(model, x_t, y_t, epochs=5)
        _models["wildfire"] = (model, red, nir, ndvi)
    return _models.get("wildfire")


def _get_floodcast_model():
    """Lazy-load and cache the FloodCast LSTM model."""
    if "floodcast" not in _models and FLOODCAST_AVAILABLE:
        print("[INFO] Training FloodCast LSTM model …")
        model, features, preds = build_and_train_model()
        _models["floodcast"] = (model, features, preds)
    return _models.get("floodcast")


def _get_forestguard_model():
    """Lazy-load and cache the ForestGuard CNN model."""
    if "forestguard" not in _models and FORESTGUARD_AVAILABLE:
        print("[INFO] Training ForestGuard CNN model …")
        inputs, labels, _ = fg_build_dataset(num_samples=200)
        model = ChangeDetectorCNN()
        fg_train_model(model, inputs, labels, epochs=8)
        _models["forestguard"] = model
    return _models.get("forestguard")


# ──────────────────────────── Routes ─────────────────────────────────────────

@app.route("/", defaults={'path': ''})
@app.route('/<path:path>')
def index(path):
    """Serve the main dashboard page (React entry)."""
    if path != "" and os.path.exists(os.path.join(FRONTEND_DIST, path)):
        return send_from_directory(FRONTEND_DIST, path)
    return render_template("index.html")


@app.route("/api/status")
def api_status():
    """Health check — returns module availability."""
    return jsonify({
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "modules": {
            "wildfire_scan": WILDFIRE_AVAILABLE,
            "flood_cast": FLOODCAST_AVAILABLE,
            "forest_guard": FORESTGUARD_AVAILABLE,
        },
    })


@app.route("/api/wildfire")
def api_wildfire():
    """
    WildfireScan endpoint — returns fire risk for a synthetic scene.

    Query Params:
        lat  (float): Centre latitude  (used for metadata only)
        lon  (float): Centre longitude (used for metadata only)
    """
    lat = float(request.args.get("lat", 37.7749))
    lon = float(request.args.get("lon", -122.4194))

    if not WILDFIRE_AVAILABLE:
        return jsonify({"error": "WildfireScan module unavailable"}), 503

    try:
        result = run_wildfire_scan()
        return jsonify({
            "lat": lat,
            "lon": lon,
            "fire_risk_score": result["score"],
            "risk_level": result["level"],
            "breakdown": result["breakdown"],
            "timestamp": datetime.utcnow().isoformat() + "Z",
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/floodcast")
def api_floodcast():
    """
    FloodCast endpoint — flood probability for given lat/lon.

    Query Params:
        lat  (float): Latitude
        lon  (float): Longitude
    """
    lat = float(request.args.get("lat", 25.2048))
    lon = float(request.args.get("lon", 55.2708))

    if not FLOODCAST_AVAILABLE:
        return jsonify({"error": "FloodCast module unavailable"}), 503

    try:
        result = _get_floodcast_model()
        _, features, preds = result

        return jsonify({
            "lat": lat,
            "lon": lon,
            "flood_probability_48h": preds["prob_48h"],
            "flood_probability_72h": preds["prob_72h"],
            "alert_level": "HIGH" if preds["prob_48h"] > 70 else "MEDIUM" if preds["prob_48h"] > 40 else "LOW",
            "hourly_windows": preds.get("n_windows", 0),
            "timestamp": datetime.utcnow().isoformat() + "Z",
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/forestguard")
def api_forestguard():
    """
    ForestGuard endpoint — deforestation detection + carbon estimate.

    Query Params:
        lat    (float): Latitude
        lon    (float): Longitude
        biome  (str):   One of tropical_rainforest, temperate_mixed_forest,
                        boreal_forest, dry_tropical_forest
    """
    lat = float(request.args.get("lat", -3.4653))
    lon = float(request.args.get("lon", -62.2159))
    biome = request.args.get("biome", "tropical_rainforest")

    if not FORESTGUARD_AVAILABLE:
        return jsonify({"error": "ForestGuard module unavailable"}), 503

    if biome not in BIOME_CARBON_DENSITY:
        biome = "tropical_rainforest"

    try:
        model = _get_forestguard_model()
        seed = abs(int(lat * 100 + lon * 100)) % 9999

        s22 = generate_ndvi_scene(64, 64, seed=seed)
        s24 = generate_deforested_scene(s22, deforestation_fraction=0.18, seed=seed + 500)
        result = detect_changes(model, s22, s24, threshold=0.5)
        carbon = estimate_from_mask(
            result["binary_mask"],
            biome=biome,
            pixel_resolution_m=30.0,
        )

        return jsonify({
            "lat": lat,
            "lon": lon,
            "biome": biome,
            "deforested_pixels": result["deforested_pixels"],
            "total_pixels": result["total_pixels"],
            "deforestation_pct": result["deforestation_pct"],
            "deforested_area_ha": carbon["deforested_area_ha"],
            "co2_equivalent_tonnes": carbon["co2_equivalent_tonnes"],
            "equivalent_cars_per_year": carbon["equivalent_cars_per_year"],
            "alert_level": (
                "CRITICAL" if result["deforestation_pct"] > 15
                else "HIGH" if result["deforestation_pct"] > 8
                else "MEDIUM" if result["deforestation_pct"] > 3
                else "LOW"
            ),
            "timestamp": datetime.utcnow().isoformat() + "Z",
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/all_threats")
def api_all_threats():
    """Aggregate summary of all three modules for the dashboard map."""
    hotspots = [
        (37.7749, -122.4194, "San Francisco Bay"),
        (34.0522, -118.2437, "Los Angeles"),
        (-3.4653, -62.2159, "Amazon Basin"),
        (1.3521, 103.8198, "Singapore / Borneo"),
        (30.0444, 31.2357, "Nile Delta"),
        (25.2048, 55.2708, "Dubai / Gulf"),
        (51.5074, -0.1278, "London / Thames"),
        (22.3964, 114.1095, "Hong Kong / Pearl River"),
    ]

    features = []
    rng = np.random.default_rng(42)

    for lat, lon, region in hotspots:
        fire_risk = round(float(rng.uniform(20, 95)), 1)
        flood_prob = round(float(rng.uniform(0.1, 0.9)), 3)
        deforest_pct = round(float(rng.uniform(0.5, 20)), 1)
        co2e = round(deforest_pct * 12.4, 1)

        features.append({
            "region": region,
            "lat": lat,
            "lon": lon,
            "wildfire": {
                "fire_risk_pct": fire_risk,
                "level": "HIGH" if fire_risk > 65 else "MEDIUM" if fire_risk > 35 else "LOW",
            },
            "flood": {
                "probability": flood_prob,
                "level": "HIGH" if flood_prob > 0.7 else "MEDIUM" if flood_prob > 0.4 else "LOW",
            },
            "deforestation": {
                "pct": deforest_pct,
                "co2_equivalent_tonnes": co2e,
                "level": (
                    "CRITICAL" if deforest_pct > 15
                    else "HIGH" if deforest_pct > 8
                    else "MEDIUM" if deforest_pct > 3
                    else "LOW"
                ),
            },
        })

    return jsonify({
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "total_hotspots": len(features),
        "hotspots": features,
    })


# ─────────────────────────── Entry Point ─────────────────────────────────────

if __name__ == "__main__":
    print("=" * 55)
    print("  EcoWatch AI — Dashboard")
    print("  http://localhost:5000")
    print("=" * 55)
    app.run(host="0.0.0.0", port=5000, debug=False)
