"""
ForestGuard — Carbon Estimator
Converts a deforestation binary mask (from change_detector.py) into
CO₂ equivalent tonnes using IPCC-aligned biomass carbon density factors.

Usage:
    python carbon_estimator.py
"""

import numpy as np
import json
import os
from datetime import datetime
from typing import Optional
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt


# ──────────────────────── Carbon Density Factors (tC/ha) ─────────────────────
# Source: IPCC Guidelines for National GHG Inventories (2006 / 2019 Refinement)

BIOME_CARBON_DENSITY: dict[str, dict] = {
    "tropical_rainforest": {
        "agb_tc_per_ha": 200.0,    # Above-ground biomass carbon (tC/ha)
        "bgb_fraction": 0.37,      # Below-ground biomass fraction of AGB
        "soil_tc_per_ha": 60.0,    # Soil organic carbon (tC/ha, top 30 cm)
        "description": "Tropical / Sub-tropical Rainforest",
    },
    "temperate_mixed_forest": {
        "agb_tc_per_ha": 120.0,
        "bgb_fraction": 0.26,
        "soil_tc_per_ha": 80.0,
        "description": "Temperate Mixed Forest",
    },
    "boreal_forest": {
        "agb_tc_per_ha": 60.0,
        "bgb_fraction": 0.39,
        "soil_tc_per_ha": 120.0,
        "description": "Boreal / Taiga Forest",
    },
    "dry_tropical_forest": {
        "agb_tc_per_ha": 80.0,
        "bgb_fraction": 0.45,
        "soil_tc_per_ha": 35.0,
        "description": "Dry Tropical Forest / Woodland",
    },
}

# CO₂ equivalent conversion factor: 1 tC → 3.6667 tCO₂e
TC_TO_TCO2E: float = 44.0 / 12.0  # ≈ 3.6667


# ─────────────────────────── Area Calculation ────────────────────────────────

def pixels_to_hectares(
    num_pixels: int,
    pixel_resolution_m: float = 30.0,
) -> float:
    """
    Convert a pixel count to area in hectares.

    Args:
        num_pixels:          Number of deforested pixels.
        pixel_resolution_m:  Ground sampling distance in metres (default 30 m
                             matches Landsat resolution).

    Returns:
        Area in hectares (float).
    """
    area_m2 = num_pixels * (pixel_resolution_m ** 2)
    area_ha = area_m2 / 10_000.0
    return round(area_ha, 4)


# ──────────────────────────── Core Estimator ─────────────────────────────────

def estimate_carbon_loss(
    deforested_area_ha: float,
    biome: str = "tropical_rainforest",
    include_soil: bool = True,
) -> dict:
    """
    Estimate CO₂ equivalent released by deforestation of a given area.

    Formula (IPCC Tier 1):
        AGB_carbon       = area_ha × agb_tc_per_ha
        BGB_carbon       = AGB_carbon × bgb_fraction
        Soil_carbon      = area_ha × soil_tc_per_ha   (if include_soil)
        Total_carbon     = AGB + BGB + Soil
        CO₂e             = Total_carbon × (44/12)

    Args:
        deforested_area_ha:  Area of deforestation in hectares.
        biome:               Key from BIOME_CARBON_DENSITY dict.
        include_soil:        Whether to include soil carbon loss.

    Returns:
        Dictionary with carbon and CO₂e breakdown.

    Raises:
        ValueError: If biome key is not recognised.
    """
    if biome not in BIOME_CARBON_DENSITY:
        raise ValueError(
            f"Unknown biome '{biome}'. Choose from: "
            f"{list(BIOME_CARBON_DENSITY.keys())}"
        )

    params = BIOME_CARBON_DENSITY[biome]
    agb_tc = deforested_area_ha * params["agb_tc_per_ha"]
    bgb_tc = agb_tc * params["bgb_fraction"]
    soil_tc = deforested_area_ha * params["soil_tc_per_ha"] if include_soil else 0.0
    total_tc = agb_tc + bgb_tc + soil_tc
    total_co2e = total_tc * TC_TO_TCO2E

    return {
        "biome": biome,
        "biome_description": params["description"],
        "deforested_area_ha": round(deforested_area_ha, 4),
        "above_ground_biomass_tc": round(agb_tc, 2),
        "below_ground_biomass_tc": round(bgb_tc, 2),
        "soil_carbon_tc": round(soil_tc, 2),
        "total_carbon_tc": round(total_tc, 2),
        "co2_equivalent_tonnes": round(total_co2e, 2),
        "equivalent_cars_per_year": round(total_co2e / 4.6, 1),  # US EPA: 4.6 tCO₂e/car/yr
        "equivalent_flights_london_nyc": round(total_co2e / 0.67, 1),  # ~0.67 tCO₂e/person
    }


def estimate_from_mask(
    binary_mask: np.ndarray,
    biome: str = "tropical_rainforest",
    pixel_resolution_m: float = 30.0,
    include_soil: bool = True,
) -> dict:
    """
    Wrapper: compute carbon loss directly from a binary deforestation mask.

    Args:
        binary_mask:         2D boolean/int array (1 = deforested).
        biome:               Forest biome type.
        pixel_resolution_m:  Satellite pixel resolution in metres.
        include_soil:        Include soil carbon loss.

    Returns:
        Full carbon estimation dictionary (see estimate_carbon_loss).
    """
    num_deforested = int(binary_mask.sum())
    area_ha = pixels_to_hectares(num_deforested, pixel_resolution_m)
    result = estimate_carbon_loss(area_ha, biome, include_soil)
    result["deforested_pixels"] = num_deforested
    result["pixel_resolution_m"] = pixel_resolution_m
    return result


# ────────────────────────── Visualisation ────────────────────────────────────

def plot_carbon_breakdown(result: dict, output_path: str = "carbon_breakdown.png") -> None:
    """
    Save a dark-theme stacked bar chart showing the carbon pool breakdown.

    Args:
        result:      Dict returned by estimate_carbon_loss / estimate_from_mask.
        output_path: Path to save the PNG.
    """
    pools = ["Above-Ground\nBiomass", "Below-Ground\nBiomass", "Soil\nCarbon"]
    values_tc = [
        result["above_ground_biomass_tc"],
        result["below_ground_biomass_tc"],
        result["soil_carbon_tc"],
    ]
    colors = ["#00e676", "#69f0ae", "#b9f6ca"]

    fig, axes = plt.subplots(1, 2, figsize=(14, 6))
    fig.patch.set_facecolor("#0f0f23")

    # Bar chart — carbon pools (tC)
    ax1 = axes[0]
    ax1.set_facecolor("#1a1a3e")
    bars = ax1.bar(pools, values_tc, color=colors, width=0.5, edgecolor="#333")
    ax1.set_ylabel("Carbon Released (tC)", color="white")
    ax1.set_title("Carbon Pool Breakdown", color="#00e5ff", fontsize=13, fontweight="bold")
    ax1.tick_params(colors="white")
    for spine in ax1.spines.values():
        spine.set_edgecolor("#444")
    for bar, val in zip(bars, values_tc):
        ax1.text(
            bar.get_x() + bar.get_width() / 2,
            bar.get_height() + 0.5,
            f"{val:.1f} tC",
            ha="center", va="bottom", color="white", fontsize=10,
        )

    # Pie chart — CO₂e comparison
    ax2 = axes[1]
    ax2.set_facecolor("#1a1a3e")
    wedge_sizes = [
        result["above_ground_biomass_tc"] * TC_TO_TCO2E,
        result["below_ground_biomass_tc"] * TC_TO_TCO2E,
        result["soil_carbon_tc"] * TC_TO_TCO2E,
    ]
    wedge_labels = [f"{p}\n{v:.1f} tCO₂e" for p, v in zip(pools, wedge_sizes)]
    ax2.pie(
        wedge_sizes,
        labels=wedge_labels,
        colors=colors,
        autopct="%1.1f%%",
        startangle=140,
        textprops={"color": "white", "fontsize": 9},
    )
    ax2.set_title("CO₂e Contribution by Pool", color="#00e5ff", fontsize=13, fontweight="bold")

    total_co2e = result["co2_equivalent_tonnes"]
    area_ha = result["deforested_area_ha"]
    fig.suptitle(
        f"ForestGuard — Carbon Estimation\n"
        f"{area_ha:.2f} ha deforested → {total_co2e:.1f} tCO₂e released",
        color="white", fontsize=14, fontweight="bold",
    )
    plt.tight_layout()
    plt.savefig(output_path, dpi=150, bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close()
    print(f"  Carbon breakdown chart saved → {output_path}")


def plot_biome_comparison(
    area_ha: float,
    output_path: str = "biome_comparison.png",
) -> None:
    """
    Bar chart comparing CO₂e emissions for the same deforestation across biomes.

    Args:
        area_ha:     Deforested area in hectares.
        output_path: Path to save the PNG.
    """
    biomes = list(BIOME_CARBON_DENSITY.keys())
    co2e_values = [
        estimate_carbon_loss(area_ha, b)["co2_equivalent_tonnes"]
        for b in biomes
    ]
    descriptions = [BIOME_CARBON_DENSITY[b]["description"] for b in biomes]
    colors = ["#ff6b6b", "#feca57", "#48dbfb", "#ff9ff3"]

    fig, ax = plt.subplots(figsize=(12, 6))
    fig.patch.set_facecolor("#0f0f23")
    ax.set_facecolor("#1a1a3e")

    y_pos = range(len(biomes))
    bars = ax.barh(y_pos, co2e_values, color=colors, edgecolor="#333")
    ax.set_yticks(list(y_pos))
    ax.set_yticklabels(descriptions, color="white", fontsize=11)
    ax.set_xlabel("CO₂ Equivalent (tonnes)", color="white")
    ax.set_title(
        f"CO₂e Release by Biome — {area_ha:.2f} ha Deforested",
        color="#00e5ff", fontsize=14, fontweight="bold",
    )
    ax.tick_params(colors="white")
    for spine in ax.spines.values():
        spine.set_edgecolor("#444")
    for bar, val in zip(bars, co2e_values):
        ax.text(
            val + max(co2e_values) * 0.01,
            bar.get_y() + bar.get_height() / 2,
            f"{val:,.1f} tCO₂e",
            va="center", color="white", fontsize=10,
        )

    plt.tight_layout()
    plt.savefig(output_path, dpi=150, bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close()
    print(f"  Biome comparison chart saved → {output_path}")


# ──────────────────────────── Main Entry Point ───────────────────────────────

def main() -> dict:
    """
    Demonstrate the carbon estimator with a synthetic deforestation mask.

    Returns:
        Carbon estimation result dictionary.
    """
    print("=" * 55)
    print("  ForestGuard — Carbon Estimator")
    print("=" * 55)

    # Simulate a binary mask (same approach as change_detector output)
    rng = np.random.default_rng(42)
    mask = rng.choice([0, 1], size=(64, 64), p=[0.85, 0.15]).astype(bool)

    print(f"\n[1/3] Synthetic mask: {mask.sum()} deforested pixels")

    print("\n[2/3] Estimating carbon loss (tropical rainforest, 30 m resolution) …")
    result = estimate_from_mask(
        binary_mask=mask,
        biome="tropical_rainforest",
        pixel_resolution_m=30.0,
        include_soil=True,
    )

    print(f"\n  Deforested area       : {result['deforested_area_ha']:.4f} ha")
    print(f"  Above-ground biomass  : {result['above_ground_biomass_tc']:.2f} tC")
    print(f"  Below-ground biomass  : {result['below_ground_biomass_tc']:.2f} tC")
    print(f"  Soil carbon           : {result['soil_carbon_tc']:.2f} tC")
    print(f"  Total carbon released : {result['total_carbon_tc']:.2f} tC")
    print(f"  CO₂ equivalent        : {result['co2_equivalent_tonnes']:.2f} tCO₂e")
    print(f"  ≈ {result['equivalent_cars_per_year']:.0f} cars driven for 1 year")
    print(f"  ≈ {result['equivalent_flights_london_nyc']:.0f} London–NYC flights")

    print("\n[3/3] Saving visualisations …")
    out_dir = os.path.join(os.path.dirname(__file__), "outputs")
    os.makedirs(out_dir, exist_ok=True)

    plot_carbon_breakdown(result, os.path.join(out_dir, "carbon_breakdown.png"))
    plot_biome_comparison(
        result["deforested_area_ha"],
        os.path.join(out_dir, "biome_comparison.png"),
    )

    result["timestamp"] = datetime.utcnow().isoformat() + "Z"
    summary_path = os.path.join(out_dir, "carbon_summary.json")
    with open(summary_path, "w") as f:
        json.dump(result, f, indent=2)
    print(f"  JSON summary saved → {summary_path}")

    print("\n✅  Carbon estimation complete.\n")
    return result


if __name__ == "__main__":
    main()
