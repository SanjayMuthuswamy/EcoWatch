import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle, ShieldAlert, CheckCircle2, Clock, MapPin,
    Filter, Search, Upload, Cpu, Trash2, Droplets, Lightbulb,
    Truck, Building, ChevronRight, Info, Plus, Flame
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const CityIssuesMonitor = () => {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('All');
    const [filterPriority, setFilterPriority] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [analyzingImage, setAnalyzingImage] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);

    useEffect(() => {
        fetchIssues();
    }, []);

    const fetchIssues = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/city_issues');
            const data = await response.json();
            setIssues(data.issues || []);
        } catch (error) {
            console.error("Error fetching issues:", error);
        } finally {
            setLoading(false);
        }
    };

    const simulateAnalysis = async () => {
        setAnalyzingImage(true);
        setAnalysisResult(null);

        try {
            // Simulate API call to /api/city_issues/analyze
            const response = await fetch('/api/city_issues/analyze', { method: 'POST' });
            const data = await response.json();

            // Artificial delay for "processing" feel
            await new Promise(resolve => setTimeout(resolve, 2000));
            setAnalysisResult(data.analysis);
        } catch (error) {
            console.error("Analysis failed:", error);
        } finally {
            setAnalyzingImage(false);
        }
    };

    const filteredIssues = issues.filter(issue => {
        const matchesType = filterType === 'All' || issue.type.includes(filterType);
        const matchesPriority = filterPriority === 'All' || issue.priority === filterPriority;
        const matchesSearch = issue.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
            issue.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesType && matchesPriority && matchesSearch;
    });

    const stats = {
        total: issues.length,
        critical: issues.filter(i => i.priority === 'Critical').length,
        resolved: issues.filter(i => i.status === 'Resolved').length,
        inProgress: issues.filter(i => i.status === 'In Progress').length
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'Critical': return 'text-accent-rose bg-accent-rose/10 border-accent-rose/20';
            case 'High': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
            case 'Medium': return 'text-accent-amber bg-accent-amber/10 border-accent-amber/20';
            case 'Low': return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
            default: return 'text-slate-400 bg-slate-100';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Resolved': return <CheckCircle2 size={14} className="text-accent-emerald" />;
            case 'In Progress': return <Clock size={14} className="text-accent-sky" />;
            case 'Reported': return <AlertTriangle size={14} className="text-accent-rose" />;
            default: return null;
        }
    };

    const getCategoryIcon = (type) => {
        const t = type.toLowerCase();
        if (t.includes('drainage')) return <Droplets size={16} />;
        if (t.includes('road')) return <Truck size={16} />;
        if (t.includes('light')) return <Lightbulb size={16} />;
        if (t.includes('waste') || t.includes('garbage')) return <Trash2 size={16} />;
        return <Building size={16} />;
    };

    return (
        <div className="flex flex-col gap-8 pb-12">
            {/* Header Area */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-primary tracking-tight">City Issues Monitor</h1>
                    <p className="text-slate-500 text-sm mt-1">Infrastructure intelligence & civic problem management dashboard.</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
                        <Plus size={16} /> Report New Issue
                    </button>
                    <button
                        onClick={simulateAnalysis}
                        disabled={analyzingImage}
                        className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                    >
                        <Cpu size={16} className={analyzingImage ? "animate-spin" : ""} />
                        {analyzingImage ? "AI Analyzing..." : "Run AI Inspector"}
                    </button>
                </div>
            </div>

            {/* AI Result Alert */}
            <AnimatePresence>
                {analysisResult && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="p-4 bg-accent-indigo/5 border border-accent-indigo/20 rounded-2xl flex items-center justify-between"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-accent-indigo text-white rounded-xl flex items-center justify-center">
                                <Cpu size={20} />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-accent-indigo uppercase tracking-widest">AI Detection Successful</div>
                                <div className="text-sm text-slate-700"> Detected <strong>{analysisResult.type.replace('_', ' ')}</strong> issue with <strong>{analysisResult.priority}</strong> priority. Confidence: <strong>{(analysisResult.confidence * 100).toFixed(0)}%</strong></div>
                            </div>
                        </div>
                        <button onClick={() => setAnalysisResult(null)} className="text-slate-400 hover:text-slate-600 font-bold p-2">Dismiss</button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard label="Total Issues" value={stats.total} icon={<Info className="text-accent-indigo" />} color="bg-accent-indigo" />
                <StatCard label="Critical" value={stats.critical} icon={<ShieldAlert className="text-accent-rose" />} color="bg-accent-rose" />
                <StatCard label="In Progress" value={stats.inProgress} icon={<Clock className="text-accent-sky" />} color="bg-accent-sky" />
                <StatCard label="Resolved" value={stats.resolved} icon={<CheckCircle2 className="text-accent-emerald" />} color="bg-accent-emerald" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Filters & List Table */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-6">
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                            <div className="relative w-full md:w-64">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search location..."
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-accent-indigo/20 transition-all font-medium"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <select
                                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-500 outline-none"
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                >
                                    <option value="All">All Types</option>
                                    <option value="Drainage">Drainage</option>
                                    <option value="Road">Road Damage</option>
                                    <option value="Light">Streetlight</option>
                                    <option value="Waste">Waste</option>
                                    <option value="Fire">Fire Safety</option>
                                </select>
                                <select
                                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-500 outline-none"
                                    value={filterPriority}
                                    onChange={(e) => setFilterPriority(e.target.value)}
                                >
                                    <option value="All">All Priorities</option>
                                    <option value="Critical">Critical</option>
                                    <option value="High">High</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            {loading ? (
                                <div className="py-12 text-center text-slate-400 text-sm font-medium">Loading regional intelligence...</div>
                            ) : filteredIssues.length === 0 ? (
                                <div className="py-12 text-center text-slate-400 text-sm font-medium">No issues found matching filters.</div>
                            ) : (
                                filteredIssues.map((issue) => (
                                    <IssueCard key={issue.id} issue={issue} getPriorityColor={getPriorityColor} getStatusIcon={getStatusIcon} getCategoryIcon={getCategoryIcon} />
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Map Context Section */}
                <div className="flex flex-col gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden min-h-[500px]">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <MapPin size={16} className="text-accent-indigo" />
                                <h3 className="text-sm font-bold text-primary uppercase tracking-widest">Tamil Nadu Hub</h3>
                            </div>
                        </div>

                        <div className="flex-1 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 relative">
                            <MapContainer
                                center={[11.1271, 78.6569]}
                                zoom={7}
                                className="h-full w-full z-10"
                                zoomControl={false}
                            >
                                <TileLayer
                                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                                    attribution='&copy; CARTO'
                                />
                                {filteredIssues.map((issue) => (
                                    <Marker
                                        key={issue.id}
                                        position={[issue.lat, issue.lon]}
                                        icon={createCustomIcon(issue.priority)}
                                    >
                                        <Popup>
                                            <div className="p-1">
                                                <div className="text-xs font-bold text-primary">{issue.type}</div>
                                                <div className="text-[10px] text-slate-500">{issue.location}</div>
                                                <div className="mt-1 font-bold text-[10px] text-accent-indigo uppercase">{issue.priority} Priority</div>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}
                            </MapContainer>
                        </div>

                        <div className="mt-6 flex flex-col gap-3">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Regional Alert feed</h4>
                            <div className="p-3 bg-slate-50 rounded-xl border border-dotted border-slate-300">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-accent-rose animate-pulse" />
                                    <span className="text-[10px] font-bold text-slate-600">Latest Report: Velachery, Chennai</span>
                                </div>
                                <p className="text-[10px] text-slate-500 leading-relaxed font-medium">Critical monsoon flooding detected in residential sectors. Emergency response teams alerted.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const IssueCard = ({ issue, getPriorityColor, getStatusIcon, getCategoryIcon }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={`bg-white border rounded-2xl transition-all duration-300 overflow-hidden ${isOpen ? 'border-accent-indigo shadow-md ring-1 ring-accent-indigo/10 scale-[1.01]' : 'border-slate-100 hover:border-slate-200'}`}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="p-4 cursor-pointer flex items-center justify-between group"
            >
                <div className="flex items-center gap-4 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isOpen ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
                        {getCategoryIcon(issue.type)}
                    </div>
                    <div className="flex flex-col min-w-[120px]">
                        <span className="text-xs font-black text-primary uppercase tracking-tight">{issue.type}</span>
                        <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">{issue.id}</span>
                    </div>
                    <div className="hidden md:flex flex-col flex-1 pl-4 border-l border-slate-100">
                        <span className="text-xs font-bold text-slate-600 truncate max-w-[200px]">{issue.location}</span>
                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">{issue.department}</span>
                    </div>
                    <div className="flex flex-col items-start gap-1 px-4 border-l border-slate-100">
                        {issue.critical_reason && (
                            <span className="text-[9px] font-black text-accent-rose bg-accent-rose/5 px-2 py-0.5 rounded border border-accent-rose/10 flex items-center gap-1 uppercase tracking-tighter">
                                <AlertTriangle size={10} /> {issue.critical_reason}
                            </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${getPriorityColor(issue.priority)}`}>
                            {issue.priority}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        {getStatusIcon(issue.status)}
                        {issue.status}
                    </div>
                    <motion.div
                        animate={{ rotate: isOpen ? 90 : 0 }}
                        className="p-2 rounded-lg bg-slate-50 text-slate-400"
                    >
                        <ChevronRight size={16} />
                    </motion.div>
                </div>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-slate-50 bg-slate-50/50"
                    >
                        <div className="p-6 flex flex-col md:flex-row gap-6">
                            <div className="flex-1 space-y-4">
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Issue Description</h4>
                                    <p className="text-sm text-slate-600 font-medium leading-relaxed italic border-l-2 border-accent-indigo/20 pl-4 py-1">
                                        "{issue.description}"
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Date Reported</div>
                                        <div className="text-xs font-bold text-slate-700">{issue.date_reported}</div>
                                    </div>
                                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Estimated Resolution</div>
                                        <div className="text-xs font-bold text-accent-sky">48-72 Hours</div>
                                    </div>
                                </div>
                            </div>
                            <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden border border-white shadow-lg relative group">
                                <img src={issue.image_url} alt="Verification" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">View Image</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const StatCard = ({ label, value, icon, color }) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm group hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-4">
            <div className={`w-10 h-10 rounded-2xl ${color}/10 flex items-center justify-center`}>
                {icon}
            </div>
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Live Status</span>
        </div>
        <div className="text-2xl font-bold text-primary tracking-tight">{value}</div>
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">{label}</div>
    </div>
);

// Leaflet helper
const createCustomIcon = (priority) => {
    let color = '#94a3b8';
    if (priority === 'Critical') color = '#f43f5e';
    if (priority === 'High') color = '#f97316';
    if (priority === 'Medium') color = '#f59e0b';

    return L.divIcon({
        className: 'custom-map-icon',
        html: `<div style="width:16px; height:16px; background:${color}; border:2px solid white; border-radius:50%; box-shadow: 0 0 10px ${color}80;"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
    });
};

export default CityIssuesMonitor;
