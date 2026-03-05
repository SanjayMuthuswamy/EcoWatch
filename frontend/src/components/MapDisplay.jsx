import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const MapDisplay = ({ data, activeTab }) => {
    if (!data) return null;

    return (
        <MapContainer
            center={[20, 0]}
            zoom={3}
            zoomControl={false}
            className="h-full w-full"
        >
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />

            {data.hotspots.map((hs, idx) => (
                <ThreatMarker key={idx} hs={hs} activeTab={activeTab} />
            ))}

            <MapController />
        </MapContainer>
    );
};

const MapController = () => {
    const map = useMap();
    // No-op for now, could be used for programmatic pans
    return null;
};

const ThreatMarker = ({ hs, activeTab }) => {
    let color = '#64748b';
    let val = 0;

    if (activeTab === 'wildfire') {
        val = hs.wildfire.fire_risk_pct;
        color = val > 65 ? '#ff3e3e' : (val > 35 ? '#ff9d00' : '#64748b');
    } else if (activeTab === 'flood') {
        val = hs.flood.probability * 100;
        color = val > 70 ? '#00d4ff' : (val > 40 ? '#ff9d00' : '#64748b');
    } else if (activeTab === 'forest') {
        val = hs.deforestation.pct;
        color = val > 15 ? '#ff3e3e' : (val > 8 ? '#ff9d00' : '#00ff9d');
    } else {
        // Global view color by highest threat
        const max = Math.max(hs.wildfire.fire_risk_pct, hs.flood.probability * 100);
        color = max > 70 ? '#ff3e3e' : (max > 40 ? '#00d4ff' : '#00ff9d');
    }

    const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="width:20px; height:20px; background:${color}; border:4px solid rgba(255,255,255,0.2); border-radius:50%; box-shadow:0 0 20px ${color}cc;"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });

    return (
        <Marker position={[hs.lat, hs.lon]} icon={customIcon}>
            <Popup closeButton={false} className="custom-popup">
                <div className="overflow-hidden">
                    <div className="p-4 bg-white/[0.05] border-b border-white/10">
                        <div className="font-header text-sm text-accent-cyan tracking-wide">📍 {hs.region}</div>
                    </div>
                    <div className="p-4 flex flex-col gap-3">
                        <PopupRow label="Wildfire Risk" value={`${hs.wildfire.fire_risk_pct}%`} color="text-accent-error" />
                        <PopupRow label="Flood Prob" value={`${(hs.flood.probability * 100).toFixed(1)}%`} color="text-accent-cyan" />
                        <PopupRow label="Deforestation" value={`${hs.deforestation.pct}%`} color="text-accent-emerald" />
                        <div className="mt-1 pt-3 border-t border-white/10 flex justify-between items-center text-[0.75rem]">
                            <span className="text-text-secondary">Carbon Release</span>
                            <span className="font-mono font-bold text-accent-orange">{hs.deforestation.co2_equivalent_tonnes} t</span>
                        </div>
                    </div>
                </div>
            </Popup>
        </Marker>
    );
};

const PopupRow = ({ label, value, color }) => (
    <div className="flex justify-between items-center text-[0.75rem]">
        <span className="text-text-secondary">{label}</span>
        <span className={`font-semibold font-mono ${color}`}>{value}</span>
    </div>
);

export default MapDisplay;
