"""
ForestGuard — Change Detector
Detects deforestation between two NDVI time periods (2022 vs 2024)
using a lightweight CNN trained on synthetic satellite band data.

Usage:
    python change_detector.py
"""

import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import os
import json
from datetime import datetime


# ─────────────────────────── Synthetic Data Generator ───────────────────────

def generate_ndvi_scene(height: int = 64, width: int = 64, seed: int = 0) -> np.ndarray:
    """
    Generate a synthetic NDVI scene as a 2D numpy array in [-1, 1].

    Dense forest pixels are clustered, degraded regions are scattered.

    Args:
        height: Scene height in pixels.
        width:  Scene width in pixels.
        seed:   Random seed for reproducibility.

    Returns:
        numpy array of shape (height, width) with NDVI values.
    """
    rng = np.random.default_rng(seed)
    # Base NDVI — mostly forested (0.5–0.9)
    scene = rng.uniform(0.5, 0.9, (height, width)).astype(np.float32)
    # Sprinkle some degraded patches (NDVI 0.1–0.3)
    num_patches = rng.integers(3, 8)
    for _ in range(num_patches):
        r = rng.integers(0, height - 8)
        c = rng.integers(0, width - 8)
        ph = rng.integers(4, 12)
        pw = rng.integers(4, 12)
        scene[r:r+ph, c:c+pw] = rng.uniform(0.1, 0.3, (ph, pw)).astype(np.float32)
    return scene


def generate_deforested_scene(
    base_scene: np.ndarray,
    deforestation_fraction: float = 0.15,
    seed: int = 42,
) -> np.ndarray:
    """
    Simulate deforestation on a base NDVI scene by degrading random patches.

    Args:
        base_scene:              2D NDVI array (2022 scene).
        deforestation_fraction:  Fraction of forest area to deforest.
        seed:                    Random seed.

    Returns:
        2D NDVI array representing the 2024 scene.
    """
    rng = np.random.default_rng(seed)
    scene = base_scene.copy()
    height, width = scene.shape
    num_pixels = int(height * width * deforestation_fraction)

    rows = rng.integers(0, height, num_pixels)
    cols = rng.integers(0, width, num_pixels)
    scene[rows, cols] = rng.uniform(0.05, 0.2, num_pixels).astype(np.float32)
    return scene


def create_change_labels(
    scene_2022: np.ndarray,
    scene_2024: np.ndarray,
    threshold: float = 0.25,
) -> np.ndarray:
    """
    Generate binary change mask: 1 = significant NDVI loss, 0 = stable.

    Args:
        scene_2022: NDVI array for the earlier year.
        scene_2024: NDVI array for the later year.
        threshold:  Min NDVI drop to count as deforestation.

    Returns:
        Binary numpy array of the same shape.
    """
    delta = scene_2022 - scene_2024
    labels = (delta > threshold).astype(np.float32)
    return labels


# ──────────────────────────── CNN Architecture ──────────────────────────────

class ChangeDetectorCNN(nn.Module):
    """
    Lightweight U-Net-inspired encoder for pixel-wise binary change detection.

    Input:  (batch, 2, H, W)  — stacked NDVI bands (2022 + 2024)
    Output: (batch, 1, H, W)  — probability map of deforested pixels
    """

    def __init__(self) -> None:
        """Initialise convolutional layers."""
        super().__init__()
        # Encoder
        self.enc1 = nn.Sequential(
            nn.Conv2d(2, 16, kernel_size=3, padding=1),
            nn.BatchNorm2d(16),
            nn.ReLU(inplace=True),
        )
        self.enc2 = nn.Sequential(
            nn.Conv2d(16, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
        )
        # Bottleneck
        self.bottleneck = nn.Sequential(
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
        )
        # Decoder
        self.dec2 = nn.Sequential(
            nn.Conv2d(64 + 32, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
        )
        self.dec1 = nn.Sequential(
            nn.Conv2d(32 + 16, 16, kernel_size=3, padding=1),
            nn.BatchNorm2d(16),
            nn.ReLU(inplace=True),
        )
        self.out = nn.Conv2d(16, 1, kernel_size=1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass through the network.

        Args:
            x: Input tensor (batch, 2, H, W).

        Returns:
            Output probability map (batch, 1, H, W) — values in [0, 1].
        """
        e1 = self.enc1(x)
        e2 = self.enc2(e1)
        b = self.bottleneck(e2)
        d2 = self.dec2(torch.cat([b, e2], dim=1))
        d1 = self.dec1(torch.cat([d2, e1], dim=1))
        return torch.sigmoid(self.out(d1))


# ─────────────────────────── Training Utilities ──────────────────────────────

def build_dataset(
    num_samples: int = 200,
    height: int = 64,
    width: int = 64,
    deforestation_fraction: float = 0.15,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Build synthetic dataset of paired NDVI scenes and change labels.

    Args:
        num_samples:             Number of sample pairs to generate.
        height:                  Scene height.
        width:                   Scene width.
        deforestation_fraction:  Fraction of forest to deforest in 2024.

    Returns:
        Tuple of (inputs, labels, base_scenes) numpy arrays.
        inputs shape: (N, 2, H, W)
        labels shape: (N, 1, H, W)
        base_scenes shape: (N, H, W)
    """
    inputs_list, labels_list, scenes_2022_list = [], [], []

    for i in range(num_samples):
        s22 = generate_ndvi_scene(height, width, seed=i)
        s24 = generate_deforested_scene(s22, deforestation_fraction, seed=i + 1000)
        label = create_change_labels(s22, s24)

        stacked = np.stack([s22, s24], axis=0)  # (2, H, W)
        inputs_list.append(stacked)
        labels_list.append(label[np.newaxis, :, :])  # (1, H, W)
        scenes_2022_list.append(s22)

    inputs = np.array(inputs_list, dtype=np.float32)
    labels = np.array(labels_list, dtype=np.float32)
    scenes_2022 = np.array(scenes_2022_list, dtype=np.float32)
    return inputs, labels, scenes_2022


def train_model(
    model: ChangeDetectorCNN,
    inputs: np.ndarray,
    labels: np.ndarray,
    epochs: int = 10,
    batch_size: int = 16,
    lr: float = 1e-3,
    device: str = "cpu",
) -> list[float]:
    """
    Train the CNN change detector on synthetic data.

    Args:
        model:      Initialised ChangeDetectorCNN.
        inputs:     (N, 2, H, W) float32 array.
        labels:     (N, 1, H, W) float32 binary array.
        epochs:     Training epochs.
        batch_size: Mini-batch size.
        lr:         Learning rate.
        device:     'cpu' or 'cuda'.

    Returns:
        List of per-epoch training loss values.
    """
    model = model.to(device)
    optimizer = optim.Adam(model.parameters(), lr=lr)
    criterion = nn.BCELoss()

    X_t = torch.from_numpy(inputs).to(device)
    y_t = torch.from_numpy(labels).to(device)

    dataset = TensorDataset(X_t, y_t)
    loader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

    losses = []
    model.train()
    for epoch in range(1, epochs + 1):
        epoch_loss = 0.0
        for xb, yb in loader:
            optimizer.zero_grad()
            preds = model(xb)
            loss = criterion(preds, yb)
            loss.backward()
            optimizer.step()
            epoch_loss += loss.item() * xb.size(0)
        avg_loss = epoch_loss / len(dataset)
        losses.append(avg_loss)
        print(f"  Epoch [{epoch:02d}/{epochs}] — Loss: {avg_loss:.4f}")

    return losses


# ──────────────────────────── Inference & Visualisation ──────────────────────

def detect_changes(
    model: ChangeDetectorCNN,
    scene_2022: np.ndarray,
    scene_2024: np.ndarray,
    threshold: float = 0.5,
    device: str = "cpu",
) -> dict:
    """
    Run inference on a single scene pair and return detection results.

    Args:
        model:       Trained ChangeDetectorCNN.
        scene_2022:  2D NDVI array for 2022.
        scene_2024:  2D NDVI array for 2024.
        threshold:   Probability cutoff for marking changed pixels.
        device:      Torch device.

    Returns:
        Dictionary with keys:
            - probability_map  (H, W) float32 [0,1]
            - binary_mask      (H, W) bool
            - deforested_pixels int
            - total_pixels      int
            - deforestation_pct float
    """
    stacked = np.stack([scene_2022, scene_2024], axis=0)[np.newaxis]  # (1,2,H,W)
    X = torch.from_numpy(stacked).to(device)

    model.eval()
    with torch.no_grad():
        prob = model(X).squeeze().cpu().numpy()  # (H, W)

    binary_mask = prob >= threshold
    deforested = int(binary_mask.sum())
    total = binary_mask.size

    return {
        "probability_map": prob,
        "binary_mask": binary_mask,
        "deforested_pixels": deforested,
        "total_pixels": total,
        "deforestation_pct": round(deforested / total * 100, 2),
    }


def save_change_map(
    scene_2022: np.ndarray,
    scene_2024: np.ndarray,
    result: dict,
    output_path: str = "change_map.png",
) -> None:
    """
    Save a side-by-side visualisation: 2022 NDVI | 2024 NDVI | Change Map.

    Args:
        scene_2022:   2D NDVI array for 2022.
        scene_2024:   2D NDVI array for 2024.
        result:       Dict returned by detect_changes().
        output_path:  Path to save the PNG file.
    """
    fig, axes = plt.subplots(1, 3, figsize=(15, 5))
    fig.patch.set_facecolor("#1a1a2e")

    titles = ["NDVI 2022", "NDVI 2024", "Deforestation Map"]
    images = [scene_2022, scene_2024, result["probability_map"]]
    cmaps = ["Greens", "Greens", "hot"]

    for ax, img, title, cmap in zip(axes, images, titles, cmaps):
        ax.set_facecolor("#16213e")
        im = ax.imshow(img, cmap=cmap, vmin=0, vmax=1)
        ax.set_title(title, color="white", fontsize=13, fontweight="bold", pad=10)
        ax.axis("off")
        plt.colorbar(im, ax=ax, fraction=0.046, pad=0.04).ax.yaxis.set_tick_params(color="white")

    pct = result["deforestation_pct"]
    fig.suptitle(
        f"ForestGuard — Change Detection | Deforestation: {pct:.1f}%",
        color="#00e5ff", fontsize=15, fontweight="bold", y=1.02,
    )
    plt.tight_layout()
    plt.savefig(output_path, dpi=150, bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close()
    print(f"  Change map saved → {output_path}")


# ──────────────────────────── Main Entry Point ───────────────────────────────

def main() -> dict:
    """
    End-to-end ForestGuard change detection pipeline.

    Returns:
        Dictionary with detection summary for downstream use.
    """
    print("=" * 55)
    print("  ForestGuard — CNN Change Detector")
    print("=" * 55)
    print("\n[1/4] Generating synthetic NDVI dataset …")
    inputs, labels, scenes_2022 = build_dataset(
        num_samples=200, height=64, width=64, deforestation_fraction=0.15
    )
    print(f"       Dataset: {inputs.shape[0]} sample pairs  "
          f"({inputs.shape[2]}×{inputs.shape[3]} px each)")

    print("\n[2/4] Training CNN …")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = ChangeDetectorCNN()
    losses = train_model(model, inputs, labels, epochs=10, batch_size=16, device=device)
    print(f"       Training complete. Final loss: {losses[-1]:.4f}")

    print("\n[3/4] Running inference on sample scene …")
    s22 = generate_ndvi_scene(height=64, width=64, seed=999)
    s24 = generate_deforested_scene(s22, deforestation_fraction=0.20, seed=1999)
    result = detect_changes(model, s22, s24, threshold=0.5, device=device)

    print(f"       Deforested pixels : {result['deforested_pixels']} / "
          f"{result['total_pixels']}")
    print(f"       Deforestation      : {result['deforestation_pct']}%")

    print("\n[4/4] Saving change map …")
    out_dir = os.path.join(os.path.dirname(__file__), "outputs")
    os.makedirs(out_dir, exist_ok=True)
    map_path = os.path.join(out_dir, "change_map.png")
    save_change_map(s22, s24, result, output_path=map_path)

    summary = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "model": "ChangeDetectorCNN",
        "deforested_pixels": result["deforested_pixels"],
        "total_pixels": result["total_pixels"],
        "deforestation_pct": result["deforestation_pct"],
        "training_final_loss": round(losses[-1], 5),
        "change_map": map_path,
    }

    summary_path = os.path.join(out_dir, "change_detection_summary.json")
    with open(summary_path, "w") as f:
        json.dump(summary, f, indent=2)
    print(f"  Summary saved → {summary_path}")

    print("\n✅  ForestGuard change detection complete.\n")
    return summary


if __name__ == "__main__":
    main()
