"""
issue_analyzer.py — City Issues Module (Tamil Nadu Focus)
=========================================================
Synthetic AI logic for detecting and classifying infrastructure issues in Tamil Nadu.
"""

import random
from datetime import datetime, timedelta

# Categories and Departments
ISSUE_METADATA = {
    "drainage": {"dept": "TWAD Board / Metro Water", "icon": "Droplets", "reasons": ["Monsoon Flooding", "Clogged Storm Drains", "Sewerage Overflow"]},
    "road_damage": {"dept": "Highways Department", "icon": "Truck", "reasons": ["Potholes after Heavy Rain", "Cracked Asphalt", "Incomplete Road Work"]},
    "streetlight": {"dept": "TANGEDCO", "icon": "Lightbulb", "reasons": ["Short Circuit", "Fused Bulb", "Vandalism"]},
    "waste": {"dept": "Corporation Sanitation", "icon": "Trash2", "reasons": ["Rapid Waste Accumulation", "Illegal Dumping", "Overflowing Dustbins"]},
    "fire_safety": {"dept": "Fire & Rescue Services", "icon": "Flame", "reasons": ["Electrical Short Circuit", "Kitchen Fire", "Industrial Hazard"]},
}

PRIORITIES = ["Critical", "High", "Medium", "Low"]
STATUSES = ["Reported", "In Progress", "Resolved"]

def analyze_issue_image(image_path=None):
    """
    Simulates AI analysis of an image to detect infrastructure problems.
    """
    issue_type = random.choice(list(ISSUE_METADATA.keys()))
    reason = random.choice(ISSUE_METADATA[issue_type]["reasons"])
    
    # Heuristic for priority assignment
    if issue_type == "fire_safety":
        priority = "Critical"
    elif issue_type == "drainage":
        priority = "Critical" if "Flooding" in reason else "High"
    elif issue_type == "road_damage":
        priority = "High"
    else:
        priority = random.choice(PRIORITIES)
        
    return {
        "type": issue_type.replace("_", " ").title(),
        "priority": priority,
        "reason": reason,
        "confidence": round(random.uniform(0.85, 0.98), 2),
        "department": ISSUE_METADATA[issue_type]["dept"]
    }

def get_city_issues():
    """
    Returns a list of synthetic city issue records for Tamil Nadu.
    """
    # Tamil Nadu Cities Focus
    locations = [
        {"name": "Marina Beach Area, Chennai", "lat": 13.0418, "lon": 80.2858},
        {"name": "Velachery (Flood Zone), Chennai", "lat": 12.9792, "lon": 80.2184},
        {"name": "Meenakshi Amman Temple, Madurai", "lat": 9.9195, "lon": 78.1193},
        {"name": "Gandhipuram, Coimbatore", "lat": 11.0183, "lon": 76.9682},
        {"name": "Srirangam Temple Area, Trichy", "lat": 10.8650, "lon": 78.6901},
        {"name": "Salem Central Park", "lat": 11.6643, "lon": 78.1460},
        {"name": "Vellore Fort Area", "lat": 12.9231, "lon": 79.1331},
    ]
    
    issues = []
    # Force some flood issues in Chennai
    for _ in range(3):
        loc = locations[1] # Velachery
        issues.append({
            "id": f"TN-ISS-{1000 + len(issues)}",
            "type": "Drainage",
            "description": f"Severe water stagnation reported in Velachery residential area.",
            "location": loc["name"],
            "lat": loc["lat"] + random.uniform(-0.005, 0.005),
            "lon": loc["lon"] + random.uniform(-0.005, 0.005),
            "priority": "Critical",
            "critical_reason": "Monsoon Flooding",
            "status": "Reported",
            "date_reported": datetime.now().strftime("%Y-%m-%d"),
            "department": ISSUE_METADATA["drainage"]["dept"],
            "image_url": "https://source.unsplash.com/featured/?flood,chennai"
        })

    for i in range(12):
        loc = random.choice(locations)
        issue_key = random.choice(list(ISSUE_METADATA.keys()))
        issue_type = issue_key.replace("_", " ").title()
        reason = random.choice(ISSUE_METADATA[issue_key]["reasons"])
        priority = random.choice(PRIORITIES)
        
        # Override for realism
        if issue_key == "fire_safety":
            priority = "Critical"
        
        status = random.choice(STATUSES)
        date_reported = (datetime.now() - timedelta(days=random.randint(0, 10))).strftime("%Y-%m-%d")
        
        issues.append({
            "id": f"TN-ISS-{1005 + i}",
            "type": issue_type,
            "description": f"{reason} problem reported near {loc['name']}.",
            "location": loc["name"],
            "lat": loc["lat"] + random.uniform(-0.01, 0.01),
            "lon": loc["lon"] + random.uniform(-0.01, 0.01),
            "priority": priority,
            "critical_reason": reason if priority in ["Critical", "High"] else None,
            "status": status,
            "date_reported": date_reported,
            "department": ISSUE_METADATA[issue_key]["dept"],
            "image_url": f"https://source.unsplash.com/featured/?{issue_key},india&sig={i}"
        })
        
    return sorted(issues, key=lambda x: datetime.strptime(x["date_reported"], "%Y-%m-%d"), reverse=True)
