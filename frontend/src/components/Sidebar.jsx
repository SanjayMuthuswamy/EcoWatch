import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, ShieldAlert, Waves, TreePine, BarChart2, ChevronRight, X } from 'lucide-react';

const Sidebar = ({ data, activeTab, setActiveTab, setSelectedHotspot }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isCollapsed, setIsCollapsed] = useState(false);

    if (!data) return null;

    const filteredHotspots = data.hotspots.filter(hs => {
        const matchesSearch = hs.region.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === 'all' ||
            (activeTab === 'wildfire' && hs.wildfire.fire_risk_pct > 30) ||
            (activeTab === 'flood' && hs.flood.probability > 0.3) ||
            (activeTab === 'forest' && hs.deforestation.pct > 5);
        return matchesSearch && matchesTab;
    });

    const stats = [
        { id: 'all', label: 'Global Overview', icon: <BarChart2 size={16} />, color: 'text-slate-600' },
        { id: 'wildfire', label: 'Wildfire Risks', icon: <ShieldAlert size={16} />, color: 'text-accent-rose' },
        { id: 'flood', label: 'Flood Forecast', icon: <Waves size={16} />, color: 'text-accent-sky' },
        { id: 'forest', label: 'Forest Monitoring', icon: <TreePine size={16} />, color: 'text-accent-emerald' },
    ];

    return (
        <aside className={`bg-white border-r border-slate-200 transition-all duration-500 ease-in-out flex flex-col z-50 ${isCollapsed ? 'w-16' : 'w-[380px]'}`}>
            {/* Sidebar Toggle (Internal) */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-20 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-primary shadow-sm z-[60]"
            >
                {isCollapsed ? <ChevronRight size={14} /> : <X size={14} />}
            </button>

            {!isCollapsed && (
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Header / Search Area */}
                    <div className="p-6 pb-4">
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Threat Intelligence</h2>

                        <div className="relative group">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-accent-indigo transition-colors" />
                            <input
                                type="text"
                                placeholder="Search by region..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-accent-indigo/20 focus:border-accent-indigo outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="px-6 mb-8">
                        <div className="flex items-center gap-1.5 p-1 bg-slate-50 border border-slate-200 rounded-2xl">
                            {stats.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => setActiveTab(s.id)}
                                    className={`flex-1 flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 ${activeTab === s.id ? 'bg-white shadow-md text-primary scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <div className={`${activeTab === s.id ? s.color : 'text-slate-300'}`}>{s.icon}</div>
                                    <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter truncate w-full text-center">{s.id}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Hotspot List */}
                    <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <ShieldAlert size={12} />
                                Active Zones ({filteredHotspots.length})
                            </div>
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-accent-rose"></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-accent-sky"></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-accent-emerald"></span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {filteredHotspots.map(hs => (
                                <HotspotCard key={hs.region} hs={hs} onSelect={() => setSelectedHotspot(hs)} />
                            ))}
                        </div>
                    </div>

                    {/* Active Metrics Footer */}
                    <div className="p-4 bg-slate-50 border-t border-slate-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-accent-emerald animate-pulse" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Real-time Feed</span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">Updt: {new Date().toLocaleTimeString()}</span>
                        </div>
                    </div>
                </div>
            )}

            {isCollapsed && (
                <div className="flex-1 flex flex-col items-center gap-6 py-8 pt-20">
                    {stats.map(s => (
                        <button
                            key={s.id}
                            onClick={() => { setActiveTab(s.id); setIsCollapsed(false); }}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activeTab === s.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-300 hover:bg-slate-50 hover:text-slate-500'}`}
                        >
                            {s.icon}
                        </button>
                    ))}
                </div>
            )}
        </aside>
    );
};

const HotspotCard = ({ hs, onSelect }) => {
    // Determine primary threat
    const maxVal = Math.max(hs.wildfire.fire_risk_pct, hs.flood.probability * 100, hs.deforestation.pct * 5);
    const primaryColor = hs.wildfire.fire_risk_pct === maxVal ? 'border-l-accent-rose' : (hs.flood.probability * 100 === maxVal ? 'border-l-accent-sky' : 'border-l-accent-emerald');

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={onSelect}
            className={`p-4 bg-white border border-slate-100 border-l-4 ${primaryColor} rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer group`}
        >
            <div className="flex justify-between items-start mb-2">
                <div className="font-bold text-sm text-slate-700 group-hover:text-accent-indigo transition-colors">{hs.region}</div>
                <ChevronRight size={14} className="text-slate-300 group-hover:text-accent-indigo group-hover:translate-x-1 transition-all" />
            </div>

            <div className="flex items-center gap-4">
                <MetricSmall label="Fire" value={`${hs.wildfire.fire_risk_pct}%`} color="text-accent-rose" />
                <MetricSmall label="Flood" value={`${(hs.flood.probability * 100).toFixed(0)}%`} color="text-accent-sky" />
                <MetricSmall label="Forest" value={`${hs.deforestation.pct}%`} color="text-accent-emerald" />
            </div>
        </motion.div>
    );
};

const MetricSmall = ({ label, value, color }) => (
    <div className="flex flex-col">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{label}</span>
        <span className={`text-[11px] font-bold ${color}`}>{value}</span>
    </div>
);

export default Sidebar;

