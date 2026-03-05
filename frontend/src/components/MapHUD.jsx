import React from 'react';

const MapHUD = ({ data }) => {
    if (!data) return null;

    const hotspots = data.hotspots;
    const maxFire = Math.max(...hotspots.map(h => h.wildfire.fire_risk_pct));
    const maxFlood = Math.max(...hotspots.map(h => h.flood.probability * 100));
    const totalCO2 = hotspots.reduce((a, b) => a + b.deforestation.co2_equivalent_tonnes, 0);
    const maxDef = Math.max(...hotspots.map(h => h.deforestation.pct));

    return (
        <div className="absolute top-[100px] right-5 z-50 flex flex-col gap-3 pointer-events-none">
            <HUDTile
                title="WildfireScan"
                value={maxFire}
                unit="% Risk"
                color="bg-accent-error"
                textColor="text-accent-error"
            />
            <HUDTile
                title="FloodCast"
                value={maxFlood.toFixed(0)}
                unit="% Prob"
                color="bg-accent-cyan"
                textColor="text-accent-cyan"
            />
            <div className="glass-panel p-4 w-[220px] rounded-[20px] pointer-events-auto">
                <h4 className="text-[0.65rem] text-text-secondary uppercase tracking-wider mb-3">ForestGuard</h4>
                <div className="flex justify-between items-end mb-2">
                    <div className="font-header text-xl font-bold text-accent-orange">{totalCO2.toFixed(0)}</div>
                    <div className="text-[0.75rem] text-text-secondary pb-1">t CO₂e</div>
                </div>
                <div className="flex justify-between items-end">
                    <div className="font-header text-lg font-bold text-accent-emerald">{maxDef}</div>
                    <div className="text-[0.75rem] text-text-secondary pb-0.5">ha</div>
                </div>
            </div>
        </div>
    );
};

const HUDTile = ({ title, value, unit, color, textColor }) => (
    <div className="glass-panel p-4 w-[220px] rounded-[20px] pointer-events-auto">
        <h4 className="text-[0.65rem] text-text-secondary uppercase tracking-wider mb-3">{title}</h4>
        <div className="flex justify-between items-end mb-2.5">
            <div className={`font-header text-2xl font-bold ${textColor}`}>{value}</div>
            <div className="text-[0.75rem] text-text-secondary pb-1">{unit}</div>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div
                className={`h-full rounded-full transition-all duration-1000 ${color}`}
                style={{ width: `${value}%` }}
            />
        </div>
    </div>
);

export default MapHUD;
