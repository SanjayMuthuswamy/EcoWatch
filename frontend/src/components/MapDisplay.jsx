import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, AlertTriangle, Droplets, TreeDeciduous, Info } from 'lucide-react';

// Marker icon fix
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
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
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
    return null;
};

const ThreatMarker = ({ hs, activeTab }) => {
    let color = '#94a3b8'; // slate-400
    let shadowColor = 'rgba(148, 163, 184, 0.4)';

    const wildfireRisk = hs.wildfire.fire_risk_pct;
    const floodProb = hs.flood.probability * 100;
    const defPct = hs.deforestation.pct;

    if (activeTab === 'wildfire') {
        color = wildfireRisk > 65 ? '#f43f5e' : (wildfireRisk > 35 ? '#f59e0b' : '#94a3b8');
        shadowColor = wildfireRisk > 65 ? 'rgba(244, 63, 94, 0.5)' : (wildfireRisk > 35 ? 'rgba(245, 158, 11, 0.5)' : 'rgba(148, 163, 184, 0.4)');
    } else if (activeTab === 'flood') {
        color = floodProb > 70 ? '#0ea5e9' : (floodProb > 40 ? '#f59e0b' : '#94a3b8');
        shadowColor = floodProb > 70 ? 'rgba(14, 165, 233, 0.5)' : (floodProb > 40 ? 'rgba(245, 158, 11, 0.5)' : 'rgba(148, 163, 184, 0.4)');
    } else if (activeTab === 'forest') {
        color = defPct > 15 ? '#f43f5e' : (defPct > 8 ? '#f59e0b' : '#10b981');
        shadowColor = defPct > 15 ? 'rgba(244, 63, 94, 0.5)' : (defPct > 8 ? 'rgba(245, 158, 11, 0.5)' : 'rgba(16, 185, 129, 0.5)');
    } else {
        const max = Math.max(wildfireRisk, floodProb);
        color = max > 70 ? '#f43f5e' : (max > 40 ? '#0ea5e9' : '#10b981');
        shadowColor = max > 70 ? 'rgba(244, 63, 94, 0.5)' : (max > 40 ? 'rgba(14, 165, 233, 0.5)' : 'rgba(16, 185, 129, 0.5)');
    }

    const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="width:24px; height:24px; background:white; border:4px solid ${color}; border-radius:50%; box-shadow:0 0 15px ${shadowColor}; display:flex; align-items:center; justify-content:center; transform: scale(1); transition: transform 0.2s ease-in-out;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
                <div style="width:6px; height:6px; background:${color}; border-radius:50%;"></div>
              </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });

    return (
        <Marker position={[hs.lat, hs.lon]} icon={customIcon}>
            <Popup closeButton={false} className="custom-popup">
                <div className="w-[280px] overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-accent-indigo" />
                            <div className="font-bold text-sm text-primary tracking-tight">{hs.region}</div>
                        </div>
                        <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-white border border-slate-200 text-slate-400">
                            {hs.lat.toFixed(2)}, {hs.lon.toFixed(2)}
                        </div>
                    </div>

                    <div className="p-4 flex flex-col gap-3.5">
                        <PopupRow icon={<AlertTriangle size={12} className="text-accent-rose" />} label="Wildfire Risk" value={`${wildfireRisk}%`} color="text-accent-rose" progress={wildfireRisk} />
                        <PopupRow icon={<Droplets size={12} className="text-accent-sky" />} label="Flood Prob" value={`${floodProb.toFixed(1)}%`} color="text-accent-sky" progress={floodProb} />
                        <PopupRow icon={<TreeDeciduous size={12} className="text-accent-emerald" />} label="Deforestation" value={`${defPct}%`} color="text-accent-emerald" progress={defPct * 5} />

                        <div className="mt-2 pt-3 border-t border-slate-100">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Carbon Impact</span>
                                <span className="text-xs font-bold text-accent-amber">{hs.deforestation.co2_equivalent_tonnes} t CO₂e</span>
                            </div>
                            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-accent-amber rounded-full" style={{ width: '65%' }}></div>
                            </div>
                        </div>
                    </div>

                    <button className="w-full py-2.5 bg-slate-50 text-[10px] font-bold text-accent-indigo uppercase tracking-widest border-t border-slate-100 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
                        <Info size={12} />
                        View Full Report
                    </button>
                </div>
            </Popup>
        </Marker>
    );
};

const PopupRow = ({ icon, label, value, color, progress }) => (
    <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
                {icon}
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{label}</span>
            </div>
            <span className={`text-xs font-bold ${color}`}>{value}</span>
        </div>
        <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full opacity-70 rounded-full ${color.replace('text-', 'bg-')}`} style={{ width: `${Math.min(100, progress)}%` }}></div>
        </div>
    </div>
);

export default MapDisplay;

