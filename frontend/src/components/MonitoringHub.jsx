import React from 'react';
import { motion } from 'framer-motion';
import {
    Bell,
    ShieldAlert,
    Activity,
    Zap,
    Database,
    Radio,
    Satellite,
    AlertTriangle,
    CheckCircle2,
    Clock,
    ArrowUpRight,
    Send
} from 'lucide-react';

const MonitoringHub = ({ data, sendTelegramTest }) => {
    if (!data) return null;

    const [sending, setSending] = React.useState(false);
    const [testResult, setTestResult] = React.useState(null);

    const handleTestAlert = async () => {
        setSending(true);
        try {
            const result = await sendTelegramTest();
            setTestResult(result);
            setTimeout(() => setTestResult(null), 5000);
        } catch (err) {
            setTestResult({ status: 'failed' });
        }
        setSending(false);
    };

    const criticalAlerts = data.hotspots.filter(hs => hs.wildfire.fire_risk_pct > 70 || hs.flood.probability > 0.6);

    return (
        <div className="flex flex-col gap-8 max-w-7xl mx-auto">
            {/* Page Header */}
            <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                    <Bell className="text-accent-rose" />
                    Monitoring & System Alerts
                </h2>
                <p className="text-sm text-slate-400 font-medium">Real-time telemetry and automated threat response protocols</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Main Alert Feed */}
                <div className="xl:col-span-2 flex flex-col gap-6">
                    <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-accent-rose/10 flex items-center justify-center text-accent-rose">
                                    <ShieldAlert size={20} />
                                </div>
                                <h3 className="font-bold text-slate-800 uppercase tracking-wider text-sm">Active Threat Feed</h3>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-accent-rose animate-ping" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Updates</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {criticalAlerts.length > 0 ? (
                                criticalAlerts.map((hs, idx) => (
                                    <AlertItem
                                        key={idx}
                                        region={hs.region}
                                        threat={hs.wildfire.fire_risk_pct > 70 ? 'High Wildfire Risk' : 'Severe Flood Warning'}
                                        severity="Critical"
                                        time="2m ago"
                                        lat={hs.lat}
                                        lon={hs.lon}
                                    />
                                ))
                            ) : (
                                <div className="py-12 text-center">
                                    <p className="text-slate-400 font-medium">No critical alerts detected in the current cycle.</p>
                                </div>
                            )}

                            <AlertItem
                                region="Boreal Belt"
                                threat="Atmospheric Variance Detected"
                                severity="Medium"
                                time="15m ago"
                                lat={55.0}
                                lon={-106.0}
                            />
                        </div>
                    </div>

                    {/* System Resources */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <ResourceCard icon={<Satellite className="text-accent-indigo" />} label="Sat-01" status="Operational" load="42%" color="bg-accent-indigo" />
                        <ResourceCard icon={<Radio className="text-accent-sky" />} label="Ground Sensors" status="Active" load="88%" color="bg-accent-sky" />
                        <ResourceCard icon={<Database className="text-accent-emerald" />} label="Neural Core" status="Optimized" load="12%" color="bg-accent-emerald" />
                    </div>
                </div>

                {/* Status Column */}
                <div className="flex flex-col gap-8">
                    <div className="bg-slate-900 p-8 rounded-[32px] border border-slate-800 shadow-2xl text-white">
                        <div className="flex items-center gap-3 mb-8">
                            <Activity size={20} className="text-accent-indigo" />
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Response Status</h3>
                        </div>

                        <div className="space-y-8">
                            <StatusRow label="Cloud Processing" value="Active" icon={<CheckCircle2 size={16} className="text-accent-emerald" />} />
                            <StatusRow label="Regional Authorities" value="Notified" icon={<CheckCircle2 size={16} className="text-accent-emerald" />} />
                            <StatusRow label="Drone Deployment" value="On Standby" icon={<Clock size={16} className="text-accent-amber" />} />
                        </div>

                        <div className="mt-12 pt-8 border-t border-slate-800">
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Core Signal Status</div>
                            <div className="flex items-end gap-1 h-12">
                                {[...Array(12)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ height: 4 }}
                                        animate={{ height: Math.random() * 48 + 4 }}
                                        transition={{ repeat: Infinity, duration: 0.5 + Math.random(), repeatType: 'reverse' }}
                                        className="flex-1 bg-accent-indigo/40 rounded-t-sm"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <Zap size={20} className="text-accent-amber" />
                            <h3 className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Optimizaion Tips</h3>
                        </div>
                        <p className="text-xs font-medium text-slate-600 leading-relaxed mb-6">
                            Neural engine suggests increasing satellite sampling rate over equatorial regions due to unusual thermal variances.
                        </p>
                        <button className="w-full py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black text-accent-indigo uppercase tracking-[0.2em] hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                            Approve Protocol
                            <ArrowUpRight size={14} />
                        </button>
                    </div>

                    {/* Telegram Intelligence Card */}
                    <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-6">
                            <Send size={20} className="text-accent-indigo" />
                            <h3 className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Telegram Intelligence</h3>
                        </div>

                        <div className="flex items-center justify-between mb-8">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">Bot Status</span>
                                <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-accent-emerald animate-pulse" />
                                    ACTIVE
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">Mode</span>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${data?.telegram_bot?.demo_mode !== false ? 'bg-accent-amber/10 text-accent-amber' : 'bg-accent-emerald/10 text-accent-emerald'}`}>
                                    {data?.telegram_bot?.demo_mode !== false ? 'DEMO' : 'LIVE'}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={handleTestAlert}
                            disabled={sending}
                            className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${sending ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200'}`}
                        >
                            {sending ? 'Processing...' : testResult ? `Test ${testResult.status.toUpperCase()}` : 'Trigger Test Alert'}
                            {!sending && !testResult && <Send size={14} />}
                        </button>

                        <p className="mt-4 text-[9px] font-medium text-slate-400 text-center italic">
                            {data?.telegram_bot?.demo_mode !== false
                                ? "Demo mode active: alerts will print to console."
                                : "Live mode active: alerts sent to configured chat ID."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AlertItem = ({ region, threat, severity, time, lat, lon }) => (
    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-md transition-all">
        <div className="flex items-center gap-5">
            <div className={`p-3 rounded-xl ${severity === 'Critical' ? 'bg-accent-rose/10 text-accent-rose' : 'bg-accent-amber/10 text-accent-amber'}`}>
                <AlertTriangle size={20} />
            </div>
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-slate-800">{region}</span>
                    <span className="text-[10px] font-bold text-slate-400">{lat.toFixed(2)}, {lon.toFixed(2)}</span>
                </div>
                <div className="text-xs font-medium text-slate-500">{threat}</div>
            </div>
        </div>
        <div className="text-right">
            <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${severity === 'Critical' ? 'text-accent-rose' : 'text-accent-amber'}`}>
                {severity}
            </div>
            <div className="text-[10px] font-bold text-slate-400">{time}</div>
        </div>
    </div>
);

const ResourceCard = ({ icon, label, status, load, color }) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                {icon}
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{load}</span>
        </div>
        <div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</div>
            <div className="text-xs font-bold text-slate-700">{status}</div>
        </div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full ${color} rounded-full`} style={{ width: load }} />
        </div>
    </div>
);

const StatusRow = ({ label, value, icon }) => (
    <div className="flex items-center justify-between">
        <div className="text-xs font-bold text-slate-400 tracking-tight">{label}</div>
        <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-200 uppercase tracking-widest">{value}</span>
            {icon}
        </div>
    </div>
);

export default MonitoringHub;
