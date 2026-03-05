import React, { useState, useEffect } from 'react';
import {
    Cpu,
    Send,
    Terminal as TerminalIcon,
    Zap,
    ShieldCheck,
    AlertCircle,
    Globe,
    MapPin,
    ArrowUpRight,
    MessageSquare,
    Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AnalyticsHub = ({ data, selectedHotspot, isFullScreen = false }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);

    useEffect(() => {
        // Initial intelligence briefing
        const briefing = selectedHotspot
            ? `Initializing localized intelligence report for ${selectedHotspot.region}... Cross-referencing satellite telemetry with historical threat patterns.`
            : "EcoWatch AI Engine Online. Global threat monitoring active. Cross-referencing 12M+ hectare data points.";

        setMessages([{ role: 'system', content: briefing, time: new Date().toLocaleTimeString() }]);
    }, [selectedHotspot]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const newUserMsg = { role: 'user', content: input, time: new Date().toLocaleTimeString() };
        setMessages(prev => [...prev, newUserMsg]);
        setInput('');
        setIsThinking(true);

        // Simulate AI response
        setTimeout(() => {
            const aiMsg = {
                role: 'ai',
                content: `Neural processing complete for requested query. Telemetry for the active sector indicates ${selectedHotspot ? selectedHotspot.wildfire.fire_risk_pct : 'low'}% variance in threat levels over the last 24h cycle. Localized sensors show high atmospheric particulate matter. ${selectedHotspot ? 'Recommended action: Deploy ground-level validation units to ' + selectedHotspot.region : 'Recommended action: Continue orbital monitoring of global hotspots.'}`,
                time: new Date().toLocaleTimeString()
            };
            setMessages(prev => [...prev, aiMsg]);
            setIsThinking(false);
        }, 1500);
    };

    if (!data) return null;

    return (
        <div className="flex flex-col gap-8 max-w-7xl mx-auto h-full overflow-hidden">
            {/* Context Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <Cpu className="text-accent-indigo" />
                        {selectedHotspot ? `Intelligence: ${selectedHotspot.region}` : "Global Intelligence Feed"}
                    </h2>
                    <p className="text-sm text-slate-400 font-medium">Neural prediction engine and real-time response terminal</p>
                </div>
                <div className="flex gap-4">
                    <div className="px-4 py-2 bg-white rounded-2xl border border-slate-200 flex items-center gap-2 shadow-sm">
                        <Activity size={16} className="text-accent-emerald" />
                        <span className="text-xs font-bold text-slate-600">Engine: Stable</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-hidden min-h-0">
                {/* AI Intelligence Terminal */}
                <div className="lg:col-span-2 flex flex-col bg-slate-900 rounded-[32px] border border-slate-800 shadow-2xl relative overflow-hidden">
                    {/* Terminal Header */}
                    <div className="px-6 py-4 bg-slate-800/50 border-b border-slate-700/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <TerminalIcon size={18} className="text-accent-indigo" />
                            <span className="text-xs font-black text-slate-300 uppercase tracking-widest">AI Intelligence Terminal</span>
                        </div>
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-accent-indigo/50"></div>
                        </div>
                    </div>

                    {/* Message Feed */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar scroll-smooth">
                        <AnimatePresence>
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                                >
                                    <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium leading-relaxed ${msg.role === 'user'
                                            ? 'bg-accent-indigo text-white rounded-br-none'
                                            : msg.role === 'system'
                                                ? 'bg-slate-800/50 text-slate-400 italic border border-slate-700'
                                                : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                                        }`}>
                                        {msg.content}
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500 mt-2 px-1">{msg.time}</span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {isThinking && (
                            <div className="flex gap-2 p-4 bg-slate-800/30 rounded-2xl w-20 justify-center">
                                <span className="w-1.5 h-1.5 bg-accent-indigo rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-accent-indigo rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                <span className="w-1.5 h-1.5 bg-accent-indigo rounded-full animate-bounce [animation-delay:0.4s]"></span>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSend} className="p-6 bg-slate-800/30 border-t border-slate-700/50">
                        <div className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Query neural engine (e.g., 'Predict fire risk for next 24h')"
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl py-4 pl-6 pr-14 text-sm text-slate-200 focus:outline-none focus:border-accent-indigo focus:ring-4 focus:ring-accent-indigo/10 transition-all font-medium"
                            />
                            <button
                                type="submit"
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-accent-indigo hover:bg-indigo-500 rounded-xl flex items-center justify-center text-white transition-colors shadow-lg shadow-indigo-500/20"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </form>
                </div>

                {/* Regional Predictive Analysis */}
                <div className="flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
                    {selectedHotspot ? (
                        <>
                            <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-accent-rose/10 flex items-center justify-center text-accent-rose">
                                        <AlertCircle size={24} />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prediction Model</div>
                                        <div className="text-lg font-bold text-slate-800">Threat Forecast</div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <PredictionRow label="48h Fire Risk" value={`${selectedHotspot.wildfire.fire_risk_pct}%`} color="text-accent-rose" progress={selectedHotspot.wildfire.fire_risk_pct} />
                                    <PredictionRow label="Daily Flood Prob" value={`${(selectedHotspot.flood.probability * 100).toFixed(1)}%`} color="text-accent-sky" progress={selectedHotspot.flood.probability * 100} />
                                    <PredictionRow label="Biomass Loss Exp." value={`${selectedHotspot.deforestation.pct}%`} color="text-accent-emerald" progress={selectedHotspot.deforestation.pct * 5} />
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-accent-indigo/10 flex items-center justify-center text-accent-indigo">
                                        <MessageSquare size={24} />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Regional Directives</div>
                                        <div className="text-lg font-bold text-slate-800">Intelligence Brief</div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <DirectiveItem icon={<ShieldCheck className="text-accent-emerald" />} text="Critical response protocols active." />
                                    <DirectiveItem icon={<Zap className="text-accent-amber" />} text="Immediate localized sensor deployment recommended." />
                                    <DirectiveItem icon={<MapPin className="text-accent-sky" />} text={`Sector ${selectedHotspot.lat.toFixed(1)} N/S identified as critical.`} />
                                </div>

                                <button className="w-full mt-8 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                                    <ArrowUpRight size={14} />
                                    Export Full Intel Report
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center py-20">
                            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 mb-6 border-4 border-slate-100">
                                <Globe size={40} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Select a Region</h3>
                            <p className="text-sm text-slate-400 font-medium px-4">Select an active threat zone from the map or sidebar to generate localized intelligence reports.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const PredictionRow = ({ label, value, color, progress }) => (
    <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{label}</span>
            <span className={`text-xs font-black ${color}`}>{value}</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, progress)}%` }}
                className={`h-full rounded-full ${color.replace('text-', 'bg-')}`}
                transition={{ duration: 1, ease: 'easeOut' }}
            />
        </div>
    </div>
);

const DirectiveItem = ({ icon, text }) => (
    <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
        <div className="mt-0.5">{icon}</div>
        <p className="text-xs font-medium text-slate-600 leading-normal">{text}</p>
    </div>
);

export default AnalyticsHub;

