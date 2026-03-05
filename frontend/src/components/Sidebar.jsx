import React from 'react';
import { motion } from 'framer-motion';

const Sidebar = ({ data, activeTab, setActiveTab }) => {
    if (!data) return null;

    const hotspots = data.hotspots;

    // Global summary logic
    const maxFire = Math.max(...hotspots.map(h => h.wildfire.fire_risk_pct));
    const fireHs = hotspots.find(h => h.wildfire.fire_risk_pct === maxFire);

    const maxFlood = Math.max(...hotspots.map(h => h.flood.probability * 100));
    const floodHs = hotspots.find(h => h.flood.probability * 100 === maxFlood);

    const maxDef = Math.max(...hotspots.map(h => h.deforestation.pct));
    const defHs = hotspots.find(h => h.deforestation.pct === maxDef);

    const totalCO2 = hotspots.reduce((a, b) => a + b.deforestation.co2_equivalent_tonnes, 0);

    const modules = [
        { id: 'all', label: 'Global', icon: '🌍' },
        { id: 'wildfire', label: 'Wildfire', icon: '🔥' },
        { id: 'flood', label: 'Flood', icon: '🌊' },
        { id: 'forest', label: 'Forest', icon: '🌳' },
    ];

    return (
        <aside className="glass-panel absolute top-[100px] left-5 bottom-5 w-[360px] z-50 p-6 flex flex-col gap-6 overflow-y-auto scrollbar-hide rounded-[20px]">
            <section>
                <div className="flex items-center gap-2 text-[0.7rem] uppercase tracking-[2px] text-text-secondary mb-4">
                    Module Control
                    <div className="flex-1 h-px bg-white/10" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {modules.map(mod => (
                        <button
                            key={mod.id}
                            onClick={() => setActiveTab(mod.id)}
                            className={`flex items-center gap-2 p-3 rounded-xl border transition-all duration-300 font-semibold text-xs ${activeTab === mod.id
                                    ? 'bg-bg-glass-bright border-accent-cyan text-accent-cyan shadow-[0_0_15px_rgba(0,212,255,0.2)]'
                                    : 'bg-white/[0.03] border-white/10 text-text-secondary hover:bg-white/[0.08] hover:border-white/20 hover:text-text-primary'
                                }`}
                        >
                            <span className="text-lg">{mod.icon}</span>
                            {mod.label}
                        </button>
                    ))}
                </div>
            </section>

            <section>
                <div className="flex items-center gap-2 text-[0.7rem] uppercase tracking-[2px] text-text-secondary mb-4">
                    Intelligence Summary
                    <div className="flex-1 h-px bg-white/10" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <StatTile value={`${maxFire}%`} label="Fire Risk" region={fireHs.region} color="text-accent-error" />
                    <StatTile value={`${maxFlood.toFixed(1)}%`} label="Flood Prob" region={floodHs.region} color="text-accent-cyan" />
                    <StatTile value={`${maxDef}%`} label="Deforestation" region={defHs.region} color="text-accent-emerald" />
                    <StatTile value={`${totalCO2.toFixed(0)}t`} label="Total CO₂e" region="Global Hotspots" color="text-accent-orange" />
                </div>
            </section>

            <section className="flex-1 flex flex-col">
                <div className="flex items-center gap-2 text-[0.7rem] uppercase tracking-[2px] text-text-secondary mb-4">
                    Active Hotspots
                    <div className="flex-1 h-px bg-white/10" />
                </div>
                <div className="flex flex-col gap-2">
                    {hotspots.map(hs => (
                        <div
                            key={hs.region}
                            className="flex items-center justify-between p-3.5 pr-4 rounded-2xl bg-white/[0.03] border border-white/10 cursor-pointer transition-all duration-200 hover:bg-white/[0.06] hover:border-accent-cyan hover:pl-5"
                        >
                            <div className="flex flex-col">
                                <div className="font-semibold text-[0.85rem]">{hs.region}</div>
                                <div className="font-mono text-[0.65rem] text-text-secondary">
                                    {hs.lat.toFixed(2)}N, {hs.lon.toFixed(2)}E
                                </div>
                            </div>
                            <div className="flex gap-2.5">
                                <span className={`text-sm ${hs.wildfire.fire_risk_pct > 50 ? 'text-accent-error' : 'text-text-secondary opacity-30'}`}>🔥</span>
                                <span className={`text-sm ${hs.flood.probability > 0.5 ? 'text-accent-cyan' : 'text-text-secondary opacity-30'}`}>🌊</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </aside>
    );
};

const StatTile = ({ value, label, region, color }) => (
    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 transition-transform duration-300 hover:-translate-y-0.5 hover:border-accent-cyan/30">
        <div className={`font-header text-xl font-bold mb-1 ${color}`}>{value}</div>
        <div className="text-[0.65rem] text-text-secondary uppercase tracking-wider">{label}</div>
        <div className="text-[0.7rem] text-accent-cyan truncate mt-2">{region}</div>
    </div>
);

export default Sidebar;
