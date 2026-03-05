"""
risk_scorer.py — WildFireScan Module
======================================
Lightweight U-Net style segmentation model for fire risk classification.

Output Classes:
  0 = Safe (healthy vegetation / water)
  1 = Burn Scar (previously burned area)
  2 = Fire Risk (dry/stressed vegetation — active risk zone)

Fire Risk Score (0–100):
  Weighted combination of class proportions and NDVI statistics.
"""

import numpy as np
import time
from pathlib import Path

import torch
import torch.nn as nn
import torch.optim as optim
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

# Local module imports
import sys
sys.path.insert(0, str(Path(__file__).parent))
from ndvi_calculator import get_bands, calculate_ndvi, get_ndvi_statistics


# ─── Lightweight U-Net Architecture ──────────────────────────────────────────

class DoubleConv(nn.Module):
    """Two consecutive Conv2d → BatchNorm → ReLU blocks (U-Net building block)."""

    def __init__(self, in_channels: int, out_channels: int):
        super().__init__()
        self.block = nn.Sequential(
            nn.Conv2d(in_channels, out_channels, 3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_channels, out_channels, 3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
        )

    def forward(self, x):
        return self.block(x)


class MiniUNet(nn.Module):
    """
    Lightweight U-Net for pixel-wise fire risk segmentation.

    Input:  (B, 2, H, W) — 2 channels: Red + NIR bands
    Output: (B, 3, H, W) — 3-class logits (safe / burn_scar / fire_risk)

    Designed to train in <30 seconds on CPU.
    """

    def __init__(self, in_channels: int = 2, num_classes: int = 3):
        super().__init__()

        # Encoder (downsampling path)
        self.enc1 = DoubleConv(in_channels, 16)
        self.pool1 = nn.MaxPool2d(2)

        self.enc2 = DoubleConv(16, 32)
        self.pool2 = nn.MaxPool2d(2)

        # Bottleneck
        self.bottleneck = DoubleConv(32, 64)

        # Decoder (upsampling path)
        self.up2 = nn.ConvTranspose2d(64, 32, kernel_size=2, stride=2)
        self.dec2 = DoubleConv(64, 32)  # 32 from up + 32 from skip

        self.up1 = nn.ConvTranspose2d(32, 16, kernel_size=2, stride=2)
        self.dec1 = DoubleConv(32, 16)  # 16 from up + 16 from skip

        # Output head
        self.head = nn.Conv2d(16, num_classes, kernel_size=1)

    def forward(self, x):
        # Encoder
        e1 = self.enc1(x)
        e2 = self.enc2(self.pool1(e1))

        # Bottleneck
        b = self.bottleneck(self.pool2(e2))

        # Decoder with skip connections
        d2 = self.dec2(torch.cat([self.up2(b), e2], dim=1))
        d1 = self.dec1(torch.cat([self.up1(d2), e1], dim=1))

        return self.head(d1)


def create_training_data(red: np.ndarray, nir: np.ndarray, ndvi: np.ndarray) -> tuple:
    """
    Generate synthetic ground-truth labels for model training based on NDVI thresholds.

    Label assignment:
      - NDVI > 0.35       → Class 0 (Safe — healthy vegetation)
      - NDVI 0.05–0.35    → Class 2 (Fire Risk — dry / stressed)
      - NDVI < 0.05       → Class 1 (Burn Scar — very low reflectance)

    Args:
        red, nir: Band arrays, float32
        ndvi: NDVI array, float32

    Returns:
        tuple: (input_tensor, label_tensor) ready for training
    """
    H, W = red.shape

    # Create pixel-wise labels from NDVI thresholds
    labels = np.zeros((H, W), dtype=np.int64)
    labels[ndvi >= 0.35] = 0   # Safe
    labels[(ndvi >= 0.05) & (ndvi < 0.35)] = 2  # Fire Risk
    labels[ndvi < 0.05] = 1   # Burn Scar
    # Replace NaN with fire risk class
    labels[np.isnan(ndvi)] = 2

    # Stack Red + NIR into 2-channel input tensor
    x = torch.tensor(np.stack([red, nir], axis=0), dtype=torch.float32).unsqueeze(0)  # (1,2,H,W)
    y = torch.tensor(labels, dtype=torch.long).unsqueeze(0)  # (1,H,W)

    return x, y


def train_model(model: nn.Module, x: torch.Tensor, y: torch.Tensor,
                epochs: int = 40, lr: float = 0.01) -> nn.Module:
    """
    Train the MiniUNet on a single scene (quick proof-of-concept training).

    Uses Cross-Entropy loss and Adam optimizer.
    Training on a single 256×256 scene completes in ~20 seconds on CPU.

    Args:
        model:  MiniUNet instance
        x:      Input tensor (1, 2, H, W)
        y:      Label tensor (1, H, W)
        epochs: Number of training epochs
        lr:     Learning rate

    Returns:
        Trained model
    """
    model.train()
    optimizer = optim.Adam(model.parameters(), lr=lr)
    criterion = nn.CrossEntropyLoss()

    print(f"\n[INFO] Training MiniUNet ({epochs} epochs)...")
    t0 = time.time()

    for epoch in range(epochs):
        optimizer.zero_grad()
        logits = model(x)       # (1, 3, H, W)
        loss = criterion(logits, y)
        loss.backward()
        optimizer.step()

        if (epoch + 1) % 10 == 0:
            print(f"  Epoch {epoch+1:3d}/{epochs} | Loss: {loss.item():.4f}")

    elapsed = time.time() - t0
    print(f"[INFO] Training complete in {elapsed:.1f}s")
    return model


def predict_segmentation(model: nn.Module, x: torch.Tensor) -> np.ndarray:
    """
    Run inference on a scene tensor and return pixel class predictions.

    Args:
        model: Trained MiniUNet
        x:     Input tensor (1, 2, H, W)

    Returns:
        pred_map: numpy array (H, W), int — class labels 0/1/2
    """
    model.eval()
    with torch.no_grad():
        logits = model(x)           # (1, 3, H, W)
        pred = logits.argmax(dim=1) # (1, H, W)
    return pred.squeeze(0).numpy().astype(np.int32)


def compute_fire_risk_score(pred_map: np.ndarray, ndvi_stats: dict) -> dict:
    """
    Compute a Fire Risk Score from 0–100 using:
      - Proportion of fire-risk pixels (class 2) — 50% weight
      - Proportion of burn-scar pixels (class 1) — 30% weight
      - Mean NDVI (inverted) — 20% weight

    Args:
        pred_map:   Segmentation output (H, W), values 0/1/2
        ndvi_stats: Dict from get_ndvi_statistics()

    Returns:
        dict with 'score' (int 0–100), 'level' (str), 'breakdown' (dict)
    """
    total_pixels = pred_map.size
    pct_fire_risk = float(np.sum(pred_map == 2)) / total_pixels   # class 2
    pct_burn_scar = float(np.sum(pred_map == 1)) / total_pixels   # class 1
    pct_safe = float(np.sum(pred_map == 0)) / total_pixels        # class 0

    # NDVI component: low NDVI → higher risk
    ndvi_mean = max(0.0, min(1.0, ndvi_stats["mean"] + 0.3))  # shift to [0,1]
    ndvi_risk = 1.0 - ndvi_mean  # invert: low NDVI = high risk

    # Weighted composite score
    raw_score = (
        pct_fire_risk * 0.50 +
        pct_burn_scar * 0.30 +
        ndvi_risk      * 0.20
    )

    # Scale to 0–100
    score = int(min(100, max(0, raw_score * 120)))  # 120 calibration factor

    # Determine severity level
    if score >= 75:
        level = "CRITICAL"
    elif score >= 50:
        level = "HIGH"
    elif score >= 25:
        level = "MODERATE"
    else:
        level = "LOW"

    return {
        "score": score,
        "level": level,
        "breakdown": {
            "pct_safe": round(pct_safe * 100, 1),
            "pct_burn_scar": round(pct_burn_scar * 100, 1),
            "pct_fire_risk": round(pct_fire_risk * 100, 1),
            "ndvi_mean": round(ndvi_stats["mean"], 3),
        }
    }


def save_fire_risk_map(pred_map: np.ndarray, risk_result: dict,
                       output_path: str = None) -> str:
    """
    Save a color-coded fire risk classification map as PNG.

    Color scheme:
      Green  = Safe (class 0)
      Orange = Burn Scar (class 1)
      Red    = Fire Risk (class 2)

    Args:
        pred_map:    Segmentation output (H, W)
        risk_result: Output dict from compute_fire_risk_score()
        output_path: File path to save PNG (default: sample_data/fire_risk_map.png)

    Returns:
        Path to saved file
    """
    if output_path is None:
        output_path = str(Path(__file__).parent / "sample_data" / "fire_risk_map.png")

    # Build RGB image
    H, W = pred_map.shape
    rgb = np.zeros((H, W, 3), dtype=np.uint8)
    rgb[pred_map == 0] = [34, 139, 34]    # Forest green (Safe)
    rgb[pred_map == 1] = [255, 140, 0]    # Dark orange (Burn Scar)
    rgb[pred_map == 2] = [220, 20, 60]    # Crimson (Fire Risk)

    fig, ax = plt.subplots(figsize=(8, 8))
    ax.imshow(rgb)
    ax.set_title(
        f"EcoWatch AI — Fire Risk Map\n"
        f"Risk Score: {risk_result['score']}/100 | Level: {risk_result['level']}",
        fontsize=13, fontweight="bold", pad=12
    )
    ax.axis("off")

    # Legend patches
    legend = [
        mpatches.Patch(color="#228B22", label=f"Safe ({risk_result['breakdown']['pct_safe']:.1f}%)"),
        mpatches.Patch(color="#FF8C00", label=f"Burn Scar ({risk_result['breakdown']['pct_burn_scar']:.1f}%)"),
        mpatches.Patch(color="#DC143C", label=f"Fire Risk ({risk_result['breakdown']['pct_fire_risk']:.1f}%)"),
    ]
    ax.legend(handles=legend, loc="lower right", fontsize=10, framealpha=0.85)

    plt.tight_layout()
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path, dpi=130, bbox_inches="tight")
    plt.close()
    print(f"[Output] Fire risk map saved → {output_path}")
    return output_path


def run_wildfire_scan(red_path: str = None, nir_path: str = None) -> dict:
    """
    Main entry point for the WildFireScan module.

    Orchestrates: data loading → NDVI → model training → segmentation →
                  risk scoring → visualization.

    Args:
        red_path: Optional path to real Red band GeoTIFF
        nir_path: Optional path to real NIR band GeoTIFF

    Returns:
        dict with keys: score, level, breakdown, output_image
    """
    print("\n" + "=" * 60)
    print("  EcoWatch AI — WildFireScan Module")
    print("=" * 60)

    # Step 1: Load satellite bands
    red, nir, source = get_bands(red_path, nir_path)
    print(f"[Source] {source} | Shape: {red.shape}")

    # Step 2: Calculate NDVI
    ndvi = calculate_ndvi(red, nir)
    ndvi_stats = get_ndvi_statistics(ndvi)
    print(f"[NDVI] Mean={ndvi_stats['mean']:.3f} | High-risk pixels={ndvi_stats['pct_high_risk']:.1f}%")

    # Step 3: Build and train MiniUNet
    model = MiniUNet(in_channels=2, num_classes=3)
    x_train, y_train = create_training_data(red, nir, ndvi)
    model = train_model(model, x_train, y_train, epochs=40)

    # Step 4: Predict segmentation map
    pred_map = predict_segmentation(model, x_train)

    # Step 5: Compute Fire Risk Score
    risk_result = compute_fire_risk_score(pred_map, ndvi_stats)
    print(f"\n[RESULT] 🔥 Fire Risk Score: {risk_result['score']}/100 ({risk_result['level']})")
    print(f"  Safe: {risk_result['breakdown']['pct_safe']}% | "
          f"Burn Scar: {risk_result['breakdown']['pct_burn_scar']}% | "
          f"Fire Risk: {risk_result['breakdown']['pct_fire_risk']}%")

    # Step 6: Save visualization
    output_path = save_fire_risk_map(pred_map, risk_result)

    return {
        "score": risk_result["score"],
        "level": risk_result["level"],
        "breakdown": risk_result["breakdown"],
        "output_image": output_path,
        "source": source,
    }


# ── Standalone execution ─────────────────────────────────────────────────────
if __name__ == "__main__":
    result = run_wildfire_scan()
    print(f"\n[Summary] Fire Risk Score = {result['score']}/100 | Level = {result['level']}")
    print(f"[Image] {result['output_image']}")
