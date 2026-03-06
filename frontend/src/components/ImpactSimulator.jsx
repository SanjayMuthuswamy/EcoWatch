import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap, ShieldAlert, Droplets, TreePine, AlertTriangle, Clock,
    Users, Building2, GraduationCap, Route, ChevronRight, ChevronDown,
    Activity, Target, Radio, Cpu, CheckCircle2, ArrowUpRight,
    Construction, Trash2, Lightbulb, Waves, MapPin, Heart, Siren,
    TriangleAlert, Wrench, AlertOctagon
} from 'lucide-react';

// ══════════════════════════════════════════════════════════════════════════════
//  DATA GENERATORS — Civic Issues, Affected Places, Risk Amplifiers
// ══════════════════════════════════════════════════════════════════════════════

const CIVIC_ISSUES_DB = {
    'Chennai (Flood Watch)': [
        { place: 'Velachery Main Road', zone: 'Velachery', problem: 'Broken road', reason: 'Slows ambulance and rescue vehicle access', priority: 'Critical', effect: 'Emergency response delayed by 15–25 min', action: 'Immediate repair and alternate routing', type: 'road' },
        { place: 'Adyar Canal — Sector 4', zone: 'Adyar', problem: 'Blocked drainage', reason: 'Water cannot drain during heavy rain, causing severe flooding', priority: 'Critical', effect: 'Flood depth increases by 0.5–1.2m', action: 'Clear drainage channel immediately', type: 'drainage' },
        { place: 'T. Nagar Market Area', zone: 'T. Nagar', problem: 'Garbage overflow', reason: 'Blocks storm water drains, increases waterlogging', priority: 'High', effect: 'Water stagnation increases disease risk', action: 'Deploy waste clearance team within 2h', type: 'waste' },
        { place: 'OMR IT Corridor', zone: 'Sholinganallur', problem: 'Waterlogging zone', reason: 'Low-lying area with poor drainage traps 50k+ commuters', priority: 'Critical', effect: 'Major traffic and evacuation bottleneck', action: 'Deploy pumps and barricade danger zones', type: 'waterlog' },
        { place: 'Tambaram Railway Station Area', zone: 'Tambaram', problem: 'Broken streetlights', reason: 'Reduces visibility during evacuation at night', priority: 'High', effect: 'Public safety risk increases 40%', action: 'Restore lighting on evacuation routes', type: 'lighting' },
        { place: 'Royapuram Fishing Harbour', zone: 'Royapuram', problem: 'Water stagnation', reason: 'Breeding ground for disease vectors during floods', priority: 'High', effect: 'Dengue/malaria outbreak risk within 48h', action: 'Spray and clear stagnant water pools', type: 'health' },
    ],
    'Delhi NCR': [
        { place: 'Minto Bridge Underpass', zone: 'Central Delhi', problem: 'Waterlogging zone', reason: 'Known flooding point that traps vehicles and delays rescue', priority: 'Critical', effect: 'Blocks north-south emergency corridor', action: 'Pre-deploy pumps before monsoon onset', type: 'waterlog' },
        { place: 'Yamuna Flood Plain', zone: 'East Delhi', problem: 'Encroached flood plain', reason: 'Reduces river discharge capacity during monsoon surge', priority: 'Critical', effect: '1.2M residents in direct flood path', action: 'Issue immediate evacuation advisory', type: 'drainage' },
        { place: 'Chandni Chowk Market', zone: 'Old Delhi', problem: 'Garbage overflow', reason: 'Narrow streets block both drainage and emergency access', priority: 'High', effect: 'Fire truck access impossible in 60% of lanes', action: 'Clear waste and mark emergency lanes', type: 'waste' },
        { place: 'Dwarka Sector 21 Road', zone: 'Dwarka', problem: 'Broken road', reason: 'Major arterial road with potholes slows emergency vehicles', priority: 'High', effect: 'Ambulance travel time increased by 12 min', action: 'Emergency pothole patching required', type: 'road' },
        { place: 'Sarojini Nagar', zone: 'South Delhi', problem: 'Broken streetlights', reason: 'Dark corridors during power outage and flood', priority: 'Medium', effect: 'Citizen panic and crowd safety risk', action: 'Install solar emergency lights', type: 'lighting' },
    ],
    'Coimbatore, TN': [
        { place: 'Noyyal River Bridge', zone: 'RS Puram', problem: 'Structural weakness', reason: 'Bridge under stress from increased water flow', priority: 'Critical', effect: 'Potential bridge collapse risk during heavy rain', action: 'Restrict heavy vehicles and monitor structurally', type: 'road' },
        { place: 'Ukkadam Bus Stand', zone: 'Ukkadam', problem: 'Waterlogging zone', reason: 'Major transport hub floods regularly', priority: 'High', effect: 'Public transport shutdown strands 100k+ commuters', action: 'Improve drainage and deploy standby buses', type: 'waterlog' },
        { place: 'SIDCO Industrial Area', zone: 'Kurichi', problem: 'Chemical storage risk', reason: 'Fire/chemical spill risk near residential zones', priority: 'Critical', effect: 'Toxic contamination radius up to 2km', action: 'Pre-position hazmat team and monitor storage units', type: 'health' },
    ],
    'Mumbai, Maharashtra': [
        { place: 'Hindmata Junction', zone: 'Dadar', problem: 'Chronic waterlogging', reason: 'Low-lying confluence of three storm drains', priority: 'Critical', effect: 'Shuts down central Mumbai connectivity', action: 'Deploy high-capacity pumps pre-monsoon', type: 'waterlog' },
        { place: 'Mithi River Channel', zone: 'Bandra-Kurla', problem: 'Blocked drainage', reason: 'Encroachments and silt reduce discharge by 40%', priority: 'Critical', effect: 'Airport and business district flooding', action: 'Emergency desilting operation', type: 'drainage' },
        { place: 'Dharavi Internal Roads', zone: 'Dharavi', problem: 'Broken roads + open drains', reason: 'No emergency vehicle access in Asia\'s largest slum', priority: 'Critical', effect: '800k residents unreachable during flood', action: 'Establish foot-patrol rescue teams and boats', type: 'road' },
        { place: 'Andheri Subway', zone: 'Andheri', problem: 'Waterlogging zone', reason: 'Major east-west link floods cutting city in half', priority: 'High', effect: 'Commuter stranding and economic loss', action: 'Install automated flood gates', type: 'waterlog' },
    ],
    'Bangalore, Karnataka': [
        { place: 'Silk Board Junction', zone: 'HSR Layout', problem: 'Waterlogging zone', reason: 'India\'s busiest junction floods during moderate rain', priority: 'Critical', effect: 'Complete traffic paralysis, 500k commuters affected', action: 'Storm drain upgrade urgently required', type: 'waterlog' },
        { place: 'Bellandur Lake', zone: 'Bellandur', problem: 'Toxic water overflow', reason: 'Polluted lake overflows into residential areas', priority: 'High', effect: 'Health emergency and property damage', action: 'Lake rejuvenation and overflow barriers', type: 'health' },
        { place: 'Outer Ring Road — Marathahalli', zone: 'Marathahalli', problem: 'Broken road', reason: 'Tech corridor arterial road in poor condition', priority: 'High', effect: 'Emergency response delayed on key IT corridor', action: 'Resurface and add emergency shoulders', type: 'road' },
    ],
};

// Fallback generator for cities not in the DB
const generateGenericCivicIssues = (region) => [
    { place: `${region.split(',')[0]} Main Road`, zone: 'Central', problem: 'Broken road surface', reason: 'Slows emergency vehicle access during disasters', priority: 'High', effect: 'Response time increased by 10–20 min', action: 'Immediate road repair on arterial routes', type: 'road' },
    { place: `${region.split(',')[0]} Storm Drain Network`, zone: 'Multiple', problem: 'Blocked drainage', reason: 'Increases flood depth during heavy rainfall events', priority: 'High', effect: 'Waterlogging in low-lying residential areas', action: 'Clear all primary storm drains within 24h', type: 'drainage' },
    { place: `${region.split(',')[0]} Market Area`, zone: 'Commercial', problem: 'Garbage overflow', reason: 'Blocks water outflow and creates health hazards', priority: 'Medium', effect: 'Localized flooding and disease vector breeding', action: 'Deploy municipal waste clearance teams', type: 'waste' },
    { place: `${region.split(',')[0]} Residential Zone`, zone: 'Suburban', problem: 'Broken streetlights', reason: 'Reduces safety during night-time evacuations', priority: 'Medium', effect: 'Public safety degraded in 30% of routes', action: 'Restore lighting on key evacuation corridors', type: 'lighting' },
];

const getCivicIssues = (region) => {
    for (const key of Object.keys(CIVIC_ISSUES_DB)) {
        if (region.includes(key.split(',')[0]) || key.includes(region.split(',')[0])) {
            return CIVIC_ISSUES_DB[key];
        }
    }
    return generateGenericCivicIssues(region);
};

// ── Risk Amplifier Logic ─────────────────────────────────────────────────────

const computeCivicRiskAmplifier = (civicIssues, flood, fire) => {
    let infraScore = 0;
    let socialScore = 0;

    civicIssues.forEach(issue => {
        const weight = issue.priority === 'Critical' ? 25 : issue.priority === 'High' ? 15 : issue.priority === 'Medium' ? 8 : 3;

        if (['road', 'drainage', 'waterlog'].includes(issue.type)) {
            infraScore += weight;
        }
        if (['waste', 'health', 'lighting'].includes(issue.type)) {
            socialScore += weight;
        }
    });

    // Normalize to 0–100
    infraScore = Math.min(100, infraScore);
    socialScore = Math.min(100, socialScore);

    // Amplification: civic issues make environmental risk worse
    const floodAmplified = Math.min(100, flood + (infraScore * 0.15));
    const fireAmplified = Math.min(100, fire + (socialScore * 0.08));

    return { infraScore, socialScore, floodAmplified, fireAmplified };
};

const generateImpactData = (hotspot) => {
    if (!hotspot) return null;

    const fire = hotspot.wildfire.fire_risk_pct;
    const flood = hotspot.flood.probability * 100;
    const forest = hotspot.deforestation.pct;

    const civicIssues = getCivicIssues(hotspot.region);
    const { infraScore, socialScore, floodAmplified, fireAmplified } = computeCivicRiskAmplifier(civicIssues, flood, fire);

    // Environmental score
    const envScore = Math.round(fire * 0.4 + flood * 0.35 + forest * 0.25);

    // Impact Severity Score — combined
    const severityScore = Math.round(envScore * 0.35 + infraScore * 0.30 + socialScore * 0.20 + Math.min(100, flood * 1.5) * 0.15);
    const severityLabel = severityScore > 75 ? 'Critical' : severityScore > 55 ? 'High' : severityScore > 35 ? 'Moderate' : 'Low';

    // Time-horizon projections (amplified by civic issues)
    const projections = [
        { label: '24h', fire: fireAmplified, flood: floodAmplified, forest },
        { label: '48h', fire: Math.min(100, fireAmplified * 1.12), flood: Math.min(100, floodAmplified * 1.18), forest: Math.min(100, forest * 1.05) },
        { label: '72h', fire: Math.min(100, fireAmplified * 1.25), flood: Math.min(100, floodAmplified * 1.35), forest: Math.min(100, forest * 1.1) },
    ];

    // Infrastructure impact (amplified by civic weakness)
    const popFactor = hotspot.region.includes('Delhi') ? 4.2 : hotspot.region.includes('Mumbai') ? 3.8 : hotspot.region.includes('Chennai') ? 2.3 : hotspot.region.includes('Bangalore') ? 1.9 : 0.8;
    const infrastructure = {
        population: (popFactor * (severityScore / 100) * 1e6).toFixed(1) + 'M',
        roads: Math.round(severityScore * 2.4) + ' km',
        hospitals: Math.round(severityScore / 8),
        schools: Math.round(severityScore / 5),
    };

    // AI recommendations — now civic-aware
    const recommendations = [];
    const criticalDrainage = civicIssues.filter(i => i.type === 'drainage' && i.priority === 'Critical');
    const criticalRoads = civicIssues.filter(i => i.type === 'road' && i.priority === 'Critical');

    if (criticalDrainage.length > 0) recommendations.push({ icon: 'flood', text: `Clear blocked drainage: ${criticalDrainage[0].place}`, priority: 'Critical' });
    if (criticalRoads.length > 0) recommendations.push({ icon: 'road', text: `Repair emergency route: ${criticalRoads[0].place}`, priority: 'Critical' });
    if (flood > 50) recommendations.push({ icon: 'flood', text: 'Deploy flood pumps in waterlogging zones', priority: 'Critical' });
    if (fire > 60) recommendations.push({ icon: 'fire', text: 'Increase satellite thermal monitoring', priority: 'Critical' });
    if (civicIssues.some(i => i.type === 'waste')) recommendations.push({ icon: 'waste', text: 'Clear waste blockage points near drains', priority: 'High' });
    if (civicIssues.some(i => i.type === 'health')) recommendations.push({ icon: 'health', text: 'Deploy health teams to stagnation zones', priority: 'High' });
    if (civicIssues.some(i => i.type === 'lighting')) recommendations.push({ icon: 'alert', text: 'Restore streetlights on evacuation routes', priority: 'High' });
    recommendations.push({ icon: 'alert', text: 'Notify disaster response authorities', priority: 'High' });
    recommendations.push({ icon: 'monitor', text: 'Alert local ward offices in affected zones', priority: 'Standard' });

    return {
        envScore, infraScore, socialScore, severityScore, severityLabel,
        projections, infrastructure, recommendations,
        fire, flood, forest, civicIssues,
        floodAmplified, fireAmplified,
    };
};

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

const ImpactSimulator = ({ data, selectedHotspot }) => {
    const [simulating, setSimulating] = useState(false);
    const [simComplete, setSimComplete] = useState(false);
    const [activeHorizon, setActiveHorizon] = useState(0);
    const [expandedIssue, setExpandedIssue] = useState(null);

    const impact = useMemo(() => generateImpactData(selectedHotspot), [selectedHotspot]);

    useEffect(() => {
        if (selectedHotspot) {
            setSimulating(true);
            setSimComplete(false);
            setExpandedIssue(null);
            const timer = setTimeout(() => { setSimulating(false); setSimComplete(true); }, 2000);
            return () => clearTimeout(timer);
        }
    }, [selectedHotspot]);

    if (!data) return null;

    // ── Empty State ──────────────────────────────────────────────────────────
    if (!selectedHotspot) {
        return (
            <div className="flex flex-col gap-8 max-w-7xl mx-auto">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <Target className="text-accent-rose" />
                        AI Disaster Impact Simulator
                    </h2>
                    <p className="text-sm text-slate-400 font-medium">Select a region to simulate predicted disaster impact with civic intelligence analysis.</p>
                </div>
                <div className="bg-white p-12 rounded-[32px] border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 mb-8 border-4 border-slate-100">
                        <Target size={48} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-3">No Region Selected</h3>
                    <p className="text-sm text-slate-400 font-medium max-w-md">Click on any city marker on the Live Map or select an Active Zone from the Threat Intelligence sidebar to launch the impact simulation engine.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 max-w-7xl mx-auto pb-12">
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <Target className="text-accent-rose" />
                        Impact Simulator: {selectedHotspot.region}
                    </h2>
                    <p className="text-sm text-slate-400 font-medium">Environmental + Civic Infrastructure combined impact analysis</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <Radio size={14} className={simComplete ? 'text-accent-emerald' : 'text-accent-amber animate-pulse'} />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        {simulating ? 'Simulating...' : 'Simulation Complete'}
                    </span>
                </div>
            </div>

            {/* ── Simulation Loading ──────────────────────────────────────── */}
            <AnimatePresence>
                {simulating && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-6 bg-slate-900 rounded-[32px] border border-slate-800 shadow-2xl flex items-center gap-6"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-accent-indigo/20 flex items-center justify-center">
                            <Cpu size={28} className="text-accent-indigo animate-spin" />
                        </div>
                        <div className="flex-1">
                            <div className="text-xs font-black text-accent-indigo uppercase tracking-widest mb-1">Neural Engine + Civic Intelligence Processing</div>
                            <div className="text-sm text-slate-400 font-medium">Cross-referencing environmental data with infrastructure weakness and social vulnerability for {selectedHotspot.region}...</div>
                        </div>
                        <div className="flex gap-1 items-end h-8">
                            {[...Array(6)].map((_, i) => (
                                <motion.div key={i} animate={{ height: [4, 20 + Math.random() * 20, 4] }} transition={{ repeat: Infinity, duration: 0.6 + i * 0.1 }} className="w-1.5 bg-accent-indigo/40 rounded-full" />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/*  RESULTS                                                      */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {simComplete && impact && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8">

                    {/* ── Row 1: Impact Severity Score + 4 Sub-Scores ─────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                        {/* Combined Severity Score */}
                        <div className="lg:col-span-1 bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Impact Severity</div>
                            <div className="relative w-24 h-24 flex items-center justify-center mb-3">
                                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                                    <motion.circle cx="50" cy="50" r="42" fill="none"
                                        stroke={impact.severityScore > 75 ? '#f43f5e' : impact.severityScore > 55 ? '#f97316' : impact.severityScore > 35 ? '#f59e0b' : '#10b981'}
                                        strokeWidth="8" strokeLinecap="round"
                                        initial={{ strokeDasharray: '0 264' }}
                                        animate={{ strokeDasharray: `${impact.severityScore * 2.64} 264` }}
                                        transition={{ duration: 1.5, ease: 'easeOut' }}
                                    />
                                </svg>
                                <span className="text-2xl font-black text-primary">{impact.severityScore}</span>
                            </div>
                            <div className={`text-[10px] font-black uppercase tracking-widest ${impact.severityScore > 75 ? 'text-accent-rose' : impact.severityScore > 55 ? 'text-orange-500' : impact.severityScore > 35 ? 'text-accent-amber' : 'text-accent-emerald'}`}>
                                {impact.severityLabel}
                            </div>
                        </div>

                        {/* 4 Sub-Scores */}
                        <MiniScoreCard label="Environmental" value={impact.envScore} icon={<ShieldAlert size={18} />} color="accent-rose" />
                        <MiniScoreCard label="Infrastructure" value={impact.infraScore} icon={<Construction size={18} />} color="accent-amber" />
                        <MiniScoreCard label="Social Vulnerability" value={impact.socialScore} icon={<Users size={18} />} color="accent-sky" />
                        <MiniScoreCard label="Flood (Amplified)" value={Math.round(impact.floodAmplified)} icon={<Droplets size={18} />} color="accent-indigo" suffix="%" />
                    </div>

                    {/* ── Row 2: Timeline Projections ─────────────────────── */}
                    <div className="bg-white p-7 rounded-[28px] border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <Clock size={18} className="text-accent-indigo" />
                                <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Predicted Impact Timeline (Civic-Amplified)</h3>
                            </div>
                            <div className="flex gap-2">
                                {['24h', '48h', '72h'].map((h, i) => (
                                    <button key={h} onClick={() => setActiveHorizon(i)}
                                        className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeHorizon === i ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                                        {h}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <ProjectionBar label="Wildfire Spread" value={impact.projections[activeHorizon].fire} color="bg-accent-rose" />
                            <ProjectionBar label="Flood Risk" value={impact.projections[activeHorizon].flood} color="bg-accent-sky" />
                            <ProjectionBar label="Deforestation" value={impact.projections[activeHorizon].forest} color="bg-accent-emerald" />
                        </div>
                    </div>

                    {/* ── Row 3: Affected Places + Risk Factors ────────────── */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        {/* Critical Affected Places — 2 cols */}
                        <div className="xl:col-span-2 bg-white p-7 rounded-[28px] border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <MapPin size={18} className="text-accent-rose" />
                                <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Critical Affected Places & Infrastructure</h3>
                                <span className="ml-auto text-[10px] font-black bg-accent-rose/10 text-accent-rose px-2 py-0.5 rounded-full">{impact.civicIssues.length} Issues</span>
                            </div>

                            <div className="space-y-2">
                                {impact.civicIssues.map((issue, idx) => (
                                    <CivicIssueRow
                                        key={idx}
                                        issue={issue}
                                        isOpen={expandedIssue === idx}
                                        onToggle={() => setExpandedIssue(expandedIssue === idx ? null : idx)}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Risk Increasing Factors — 1 col */}
                        <div className="bg-slate-900 p-7 rounded-[28px] border border-slate-800 shadow-2xl">
                            <div className="flex items-center gap-3 mb-6">
                                <TriangleAlert size={18} className="text-accent-amber" />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Risk Increasing Factors</h3>
                            </div>
                            <div className="space-y-3">
                                {impact.civicIssues.filter(i => i.priority === 'Critical' || i.priority === 'High').map((issue, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${issue.priority === 'Critical' ? 'bg-accent-rose/20 text-accent-rose' : 'bg-accent-amber/20 text-accent-amber'}`}>
                                            {getIssueIcon(issue.type, 14)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[11px] font-bold text-slate-200 truncate">{issue.problem}</div>
                                            <div className="text-[10px] text-slate-500 font-medium mt-0.5">{issue.reason}</div>
                                        </div>
                                        <PriorityBadge priority={issue.priority} small />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Row 4: Infrastructure Impact + AI Recommendations ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Infrastructure Impact */}
                        <div className="bg-white p-7 rounded-[28px] border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <Building2 size={18} className="text-accent-amber" />
                                <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Infrastructure Impact</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <InfraCard icon={<Users size={18} className="text-accent-rose" />} label="Population Exposed" value={impact.infrastructure.population} />
                                <InfraCard icon={<Route size={18} className="text-accent-amber" />} label="Roads Affected" value={impact.infrastructure.roads} />
                                <InfraCard icon={<Building2 size={18} className="text-accent-sky" />} label="Hospitals at Risk" value={impact.infrastructure.hospitals} />
                                <InfraCard icon={<GraduationCap size={18} className="text-accent-emerald" />} label="Schools Affected" value={impact.infrastructure.schools} />
                            </div>
                        </div>

                        {/* AI Recommended Response */}
                        <div className="bg-slate-900 p-7 rounded-[28px] border border-slate-800 shadow-2xl">
                            <div className="flex items-center gap-3 mb-6">
                                <Zap size={18} className="text-accent-indigo" />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">AI Response Suggestions</h3>
                            </div>
                            <div className="space-y-2.5">
                                {impact.recommendations.map((rec, idx) => (
                                    <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.08 }}
                                        className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 group hover:bg-slate-800 transition-all">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${rec.priority === 'Critical' ? 'bg-accent-rose/20 text-accent-rose' : rec.priority === 'High' ? 'bg-accent-amber/20 text-accent-amber' : 'bg-accent-indigo/20 text-accent-indigo'}`}>
                                            {getRecIcon(rec.icon, 16)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[12px] font-bold text-slate-200">{rec.text}</div>
                                            <div className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${rec.priority === 'Critical' ? 'text-accent-rose' : rec.priority === 'High' ? 'text-accent-amber' : 'text-slate-500'}`}>
                                                {rec.priority} Priority
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════════
//  SUB-COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

const getIssueIcon = (type, size = 16) => {
    switch (type) {
        case 'road': return <Construction size={size} />;
        case 'drainage': return <Waves size={size} />;
        case 'waste': return <Trash2 size={size} />;
        case 'waterlog': return <Droplets size={size} />;
        case 'lighting': return <Lightbulb size={size} />;
        case 'health': return <Heart size={size} />;
        default: return <AlertTriangle size={size} />;
    }
};

const getRecIcon = (type, size = 16) => {
    switch (type) {
        case 'flood': return <Droplets size={size} />;
        case 'fire': return <ShieldAlert size={size} />;
        case 'road': return <Construction size={size} />;
        case 'waste': return <Trash2 size={size} />;
        case 'health': return <Heart size={size} />;
        case 'alert': return <AlertTriangle size={size} />;
        default: return <Activity size={size} />;
    }
};

const PriorityBadge = ({ priority, small = false }) => {
    const colors = {
        Critical: 'bg-accent-rose/10 text-accent-rose border-accent-rose/20',
        High: 'bg-accent-amber/10 text-accent-amber border-accent-amber/20',
        Medium: 'bg-accent-sky/10 text-accent-sky border-accent-sky/20',
        Low: 'bg-slate-100 text-slate-400 border-slate-200',
    };
    return (
        <span className={`${small ? 'text-[8px] px-1.5 py-0.5' : 'text-[9px] px-2 py-0.5'} font-black uppercase tracking-wider rounded-md border ${colors[priority] || colors.Low}`}>
            {priority}
        </span>
    );
};

const CivicIssueRow = ({ issue, isOpen, onToggle }) => (
    <div className={`border rounded-xl transition-all duration-200 overflow-hidden ${isOpen ? 'border-accent-indigo/30 shadow-md ring-1 ring-accent-indigo/10' : 'border-slate-100 hover:border-slate-200 hover:shadow-sm'}`}>
        <div onClick={onToggle} className="flex items-center gap-3 p-3.5 cursor-pointer group">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${issue.priority === 'Critical' ? 'bg-accent-rose/10 text-accent-rose' : issue.priority === 'High' ? 'bg-accent-amber/10 text-accent-amber' : 'bg-accent-sky/10 text-accent-sky'}`}>
                {getIssueIcon(issue.type)}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold text-slate-800 truncate">{issue.place}</span>
                    <PriorityBadge priority={issue.priority} small />
                </div>
                <div className="text-[10px] font-medium text-slate-400 mt-0.5">{issue.problem} · {issue.zone}</div>
            </div>
            <motion.div animate={{ rotate: isOpen ? 180 : 0 }} className="text-slate-300">
                <ChevronDown size={16} />
            </motion.div>
        </div>

        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="border-t border-slate-100 bg-slate-50/50"
                >
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <DetailField label="Why it increases risk" value={issue.reason} />
                        <DetailField label="Estimated effect" value={issue.effect} />
                        <DetailField label="Recommended action" value={issue.action} highlight />
                        <DetailField label="Zone" value={issue.zone} />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);

const DetailField = ({ label, value, highlight = false }) => (
    <div>
        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</div>
        <div className={`text-[11px] font-medium leading-relaxed ${highlight ? 'text-accent-indigo font-bold' : 'text-slate-600'}`}>{value}</div>
    </div>
);

const MiniScoreCard = ({ label, value, icon, color, suffix = '' }) => (
    <div className="bg-white p-5 rounded-[28px] border border-slate-200 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
            <div className={`w-10 h-10 rounded-xl bg-${color}/10 flex items-center justify-center text-${color}`}>{icon}</div>
            <span className={`text-xl font-black text-${color}`}>{Math.round(value)}{suffix}</span>
        </div>
        <div>
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{label}</div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, value)}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                    className={`h-full bg-${color} rounded-full`} />
            </div>
        </div>
    </div>
);

const ProjectionBar = ({ label, value, color }) => (
    <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">{label}</span>
            <span className="text-sm font-black text-primary">{value.toFixed(1)}%</span>
        </div>
        <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, value)}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full ${color} rounded-full relative`}>
                <div className="absolute right-1.5 top-0 h-full flex items-center">
                    <span className="text-[8px] font-black text-white drop-shadow">{value.toFixed(0)}%</span>
                </div>
            </motion.div>
        </div>
    </div>
);

const InfraCard = ({ icon, label, value }) => (
    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3 group hover:bg-white hover:shadow-md transition-all">
        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">{icon}</div>
        <div>
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</div>
            <div className="text-lg font-black text-primary tracking-tight">{value}</div>
        </div>
    </div>
);

export default ImpactSimulator;
