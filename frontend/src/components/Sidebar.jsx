import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, ShieldAlert, Waves, TreePine, BarChart2, ChevronRight, X, Activity } from 'lucide-react';

const Sidebar = ({ data, activeTab, setActiveTab, setSelectedHotspot, searchQuery, setSearchQuery }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [expandedRegion, setExpandedRegion] = useState(null);

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
                                <HotspotCard
                                    key={hs.region}
                                    hs={hs}
                                    isOpen={expandedRegion === hs.region}
                                    onToggle={() => {
                                        setExpandedRegion(expandedRegion === hs.region ? null : hs.region);
                                        setSelectedHotspot(hs);
                                    }}
                                />
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

const HotspotCard = ({ hs, isOpen, onToggle }) => {
    // Determine primary threat
    const maxVal = Math.max(hs.wildfire.fire_risk_pct, hs.flood.probability * 100, hs.deforestation.pct * 5);
    const primaryColor = hs.wildfire.fire_risk_pct === maxVal ? 'border-l-accent-rose' : (hs.flood.probability * 100 === maxVal ? 'border-l-accent-sky' : 'border-l-accent-emerald');
    const accentColor = hs.wildfire.fire_risk_pct === maxVal ? 'text-accent-rose' : (hs.flood.probability * 100 === maxVal ? 'text-accent-sky' : 'text-accent-emerald');

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`bg-white border rounded-xl transition-all duration-300 overflow-hidden ${isOpen ? 'border-accent-indigo shadow-lg ring-1 ring-accent-indigo/10 scale-[1.02]' : 'border-slate-100 border-l-4 ' + primaryColor + ' shadow-sm hover:shadow-md'}`}
        >
            <div
                onClick={onToggle}
                className="p-4 cursor-pointer group"
            >
                <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col">
                        <div className={`font-bold text-sm transition-colors ${isOpen ? 'text-accent-indigo' : 'text-slate-700 group-hover:text-accent-indigo'}`}>
                            {hs.region}
                        </div>
                        {isOpen && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Active Intelligence Node</span>}
                    </div>
                    <motion.div
                        animate={{ rotate: isOpen ? 90 : 0 }}
                        className={`transition-colors ${isOpen ? 'text-accent-indigo' : 'text-slate-300 group-hover:text-accent-indigo'}`}
                    >
                        <ChevronRight size={16} />
                    </motion.div>
                </div>

                <div className="flex items-center gap-4">
                    <MetricSmall label="Fire" value={`${hs.wildfire.fire_risk_pct}%`} color="text-accent-rose" />
                    <MetricSmall label="Flood" value={`${(hs.flood.probability * 100).toFixed(0)}%`} color="text-accent-sky" />
                    <MetricSmall label="Forest" value={`${hs.deforestation.pct}%`} color="text-accent-emerald" />
                </div>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "circOut" }}
                        className="bg-slate-50/50 border-t border-slate-100"
                    >
                        <div className="p-4 space-y-4">
                            {/* Trends Visualization */}
                            <div>
                                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                                    Historical Risk Trend
                                    <span className="text-accent-emerald">Stable</span>
                                </h4>
                                <div className="flex items-end gap-1 h-8 px-1">
                                    {[0.4, 0.6, 0.5, 0.8, 0.7, 0.9, 0.75].map((val, i) => (
                                        <div
                                            key={i}
                                            className={`flex-1 rounded-t-sm ${i === 6 ? 'bg-accent-indigo' : 'bg-slate-200'}`}
                                            style={{ height: `${val * 100}%` }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* AI Explanation */}
                            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-2 mb-1.5 text-accent-indigo font-bold text-[10px] uppercase tracking-tighter">
                                    <Activity size={12} /> AI Risk Assessment
                                </div>
                                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                                    Current {maxVal.toFixed(0)}% risk index driven by unusual {hs.wildfire.fire_risk_pct > 60 ? 'thermal variance' : 'moisture accumulation'} patterns in the {hs.region.split(' ')[0]} sector.
                                </p>
                            </div>

                            {/* Recommended Actions */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="p-2.5 bg-accent-rose/5 border border-accent-rose/10 rounded-xl">
                                    <div className="text-[9px] font-black text-accent-rose uppercase mb-1">Action</div>
                                    <div className="text-[10px] font-bold text-slate-700">Deploy Sensors</div>
                                </div>
                                <div className="p-2.5 bg-accent-sky/5 border border-accent-sky/10 rounded-xl">
                                    <div className="text-[9px] font-black text-accent-sky uppercase mb-1">Response</div>
                                    <div className="text-[10px] font-bold text-slate-700">Notify Authorities</div>
                                </div>
                            </div>

                            {/* Footer / Meta */}
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-[9px] font-bold text-slate-400 uppercase">Sector ID: TN-092-A</span>
                                <span className="text-[9px] font-black text-accent-indigo uppercase">Update: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
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

