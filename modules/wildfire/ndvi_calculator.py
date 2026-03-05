"""
ndvi_calculator.py — WildFireScan Module
=========================================
Calculates NDVI (Normalized Difference Vegetation Index) from satellite imagery.
Supports both real GeoTIFF files (via rasterio) and synthetic numpy arrays.

NDVI Formula: (NIR - Red) / (NIR + Red)
  - NDVI > 0.4  : Dense vegetation (low fire risk)
  - NDVI 0.1–0.4: Sparse vegetation (moderate risk)
  - NDVI < 0.1  : Bare soil / burnt / non-vegetated (high risk)
"""

import numpy as np
import os
from pathlib import Path

# Try importing rasterio for real GeoTIFF support
try:
    import rasterio
    RASTERIO_AVAILABLE = True
except ImportError:
    RASTERIO_AVAILABLE = False
    print("[WARN] rasterio not available — using synthetic data mode")


def generate_synthetic_scene(height: int = 256, width: int = 256, seed: int = 42) -> tuple:
    """
    Generate a realistic synthetic satellite scene with Red (Band 4) and NIR (Band 8).

    Simulates a Tamil Nadu-like landscape with:
      - Forest patches (high NDVI)
      - Agricultural fields (moderate NDVI)
      - Dry/stressed vegetation (low NDVI — fire-prone)
      - Burn scars (very low NDVI)

    Returns:
        tuple: (red_band, nir_band) as numpy float32 arrays in [0, 1] range
    """
    rng = np.random.default_rng(seed)

    # Base reflectance values — realistic Sentinel-2 digital numbers scaled to [0,1]
    red = np.zeros((height, width), dtype=np.float32)
    nir = np.zeros((height, width), dtype=np.float32)

    # ----- Region 1: Dense forest (top-left quadrant) — high NDVI -----
    red[0:100, 0:100] = rng.normal(0.04, 0.005, (100, 100)).clip(0.01, 0.15)
    nir[0:100, 0:100] = rng.normal(0.45, 0.04, (100, 100)).clip(0.30, 0.65)

    # ----- Region 2: Agricultural / scrub (top-right) — moderate NDVI -----
    red[0:100, 100:200] = rng.normal(0.10, 0.01, (100, 100)).clip(0.05, 0.20)
    nir[0:100, 100:200] = rng.normal(0.30, 0.04, (100, 100)).clip(0.20, 0.45)

    # ----- Region 3: Open water / road (top-far-right) -----
    red[0:100, 200:] = rng.normal(0.05, 0.005, (100, 56)).clip(0.02, 0.12)
    nir[0:100, 200:] = rng.normal(0.05, 0.005, (100, 56)).clip(0.02, 0.12)

    # ----- Region 4: Dry / stressed vegetation (middle) — fire risk zone -----
    red[100:180, :] = rng.normal(0.18, 0.02, (80, width)).clip(0.10, 0.35)
    nir[100:180, :] = rng.normal(0.22, 0.03, (80, width)).clip(0.10, 0.38)

    # ----- Region 5: Active burn scar (bottom-left) — very low NDVI -----
    red[180:, 0:128] = rng.normal(0.30, 0.02, (76, 128)).clip(0.20, 0.45)
    nir[180:, 0:128] = rng.normal(0.08, 0.01, (76, 128)).clip(0.03, 0.15)

    # ----- Region 6: Mixed urban/bare soil (bottom-right) -----
    red[180:, 128:] = rng.normal(0.22, 0.02, (76, 128)).clip(0.12, 0.40)
    nir[180:, 128:] = rng.normal(0.18, 0.02, (76, 128)).clip(0.08, 0.32)

    # Add subtle spatial noise to make the scene realistic
    red += rng.normal(0, 0.003, (height, width)).astype(np.float32)
    nir += rng.normal(0, 0.003, (height, width)).astype(np.float32)

    # Clip to valid reflectance range
    red = np.clip(red, 0.0, 1.0)
    nir = np.clip(nir, 0.0, 1.0)

    return red, nir


def load_bands_from_geotiff(red_path: str, nir_path: str) -> tuple:
    """
    Load Red (Band 4) and NIR (Band 8) bands from GeoTIFF files.

    Args:
        red_path: Path to the Red band GeoTIFF file
        nir_path: Path to the NIR band GeoTIFF file

    Returns:
        tuple: (red_band, nir_band) as numpy float32 arrays normalized to [0,1]

    Raises:
        FileNotFoundError: If the GeoTIFF files do not exist
    """
    if not RASTERIO_AVAILABLE:
        raise RuntimeError("rasterio is not installed. Install it with: pip install rasterio")

    if not os.path.exists(red_path):
        raise FileNotFoundError(f"Red band file not found: {red_path}")
    if not os.path.exists(nir_path):
        raise FileNotFoundError(f"NIR band file not found: {nir_path}")

    with rasterio.open(red_path) as src:
        red = src.read(1).astype(np.float32)
        # Normalize to [0, 1] from Sentinel-2 DN (0–10000)
        red = red / 10000.0

    with rasterio.open(nir_path) as src:
        nir = src.read(1).astype(np.float32)
        nir = nir / 10000.0

    return red.clip(0, 1), nir.clip(0, 1)


def calculate_ndvi(red: np.ndarray, nir: np.ndarray) -> np.ndarray:
    """
    Compute NDVI from Red and NIR reflectance arrays.

    Args:
        red: Red band array (Band 4), float32, values in [0, 1]
        nir: NIR band array (Band 8), float32, values in [0, 1]

    Returns:
        ndvi: NDVI array, float32, values in [-1, 1]
              NaN where both bands are zero (no valid data)
    """
    # Avoid division by zero — use masked operations
    denominator = nir + red
    ndvi = np.where(
        denominator > 1e-6,
        (nir - red) / denominator,
        np.nan
    ).astype(np.float32)

    return ndvi


def get_ndvi_statistics(ndvi: np.ndarray) -> dict:
    """
    Compute descriptive statistics for an NDVI array.

    Args:
        ndvi: NDVI array, float32, may contain NaN

    Returns:
        dict with keys: mean, median, std, min, max, pct_high_risk
    """
    valid = ndvi[~np.isnan(ndvi)]
    pct_high_risk = float(np.sum(valid < 0.1) / len(valid) * 100) if len(valid) > 0 else 0.0

    return {
        "mean": float(np.nanmean(ndvi)),
        "median": float(np.nanmedian(ndvi)),
        "std": float(np.nanstd(ndvi)),
        "min": float(np.nanmin(ndvi)),
        "max": float(np.nanmax(ndvi)),
        "pct_high_risk": round(pct_high_risk, 2),  # % pixels with NDVI < 0.1
    }


def get_bands(red_path: str = None, nir_path: str = None) -> tuple:
    """
    Smart band loader — tries real GeoTIFF first, falls back to synthetic data.

    Args:
        red_path: Optional path to Red band GeoTIFF
        nir_path: Optional path to NIR band GeoTIFF

    Returns:
        tuple: (red, nir, source) where source is 'real' or 'synthetic'
    """
    # Attempt to load real data if paths provided and rasterio available
    if red_path and nir_path and RASTERIO_AVAILABLE:
        try:
            red, nir = load_bands_from_geotiff(red_path, nir_path)
            print(f"[INFO] Loaded real satellite data: {red.shape}")
            return red, nir, "real"
        except Exception as e:
            print(f"[WARN] Could not load real data ({e}) — falling back to synthetic")

    # Fallback: generate synthetic data
    # NOTE: This is SYNTHETIC DATA for demonstration purposes
    print("[INFO] Generating synthetic satellite scene (Tamil Nadu-like landscape)")
    red, nir = generate_synthetic_scene()
    return red, nir, "synthetic"


# ── Standalone execution ─────────────────────────────────────────────────────
if __name__ == "__main__":
    import matplotlib.pyplot as plt

    print("=" * 60)
    print("  WildFireScan — NDVI Calculator")
    print("=" * 60)

    # Load bands (synthetic fallback)
    red, nir, source = get_bands()

    # Calculate NDVI
    ndvi = calculate_ndvi(red, nir)
    stats = get_ndvi_statistics(ndvi)

    print(f"\n[Source] {source}")
    print(f"[Shape] {ndvi.shape}")
    print(f"[NDVI Stats]")
    for k, v in stats.items():
        print(f"  {k}: {v:.4f}" if isinstance(v, float) else f"  {k}: {v}")

    # Save NDVI visualization
    fig, axes = plt.subplots(1, 3, figsize=(15, 5))
    fig.suptitle("EcoWatch AI — NDVI Analysis", fontsize=14, fontweight="bold")

    axes[0].imshow(red, cmap="Reds", vmin=0, vmax=0.5)
    axes[0].set_title("Red Band (Band 4)")
    axes[0].axis("off")

    axes[1].imshow(nir, cmap="YlGn", vmin=0, vmax=0.6)
    axes[1].set_title("NIR Band (Band 8)")
    axes[1].axis("off")

    im = axes[2].imshow(ndvi, cmap="RdYlGn", vmin=-0.3, vmax=0.7)
    axes[2].set_title("NDVI")
    axes[2].axis("off")
    plt.colorbar(im, ax=axes[2], shrink=0.8)

    plt.tight_layout()
    out_path = Path(__file__).parent / "sample_data" / "ndvi_analysis.png"
    out_path.parent.mkdir(exist_ok=True)
    plt.savefig(str(out_path), dpi=120, bbox_inches="tight")
    print(f"\n[Output] Saved NDVI visualization → {out_path}")
    plt.show()
