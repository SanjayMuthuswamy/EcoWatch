import React from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { ShieldAlert, Waves, TreePine, BarChart3, TrendingUp, AlertCircle, Calendar } from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const AnalyticsHub = ({ data, isFullScreen = false }) => {
    if (!data) return null;

    const hotspots = data.hotspots;
    const labels = hotspots.map(h => h.region.split('/')[0].trim());
    const floodData = hotspots.map(h => h.flood.probability * 100);
    const fireData = hotspots.map(h => h.wildfire.fire_risk_pct);
    const co2Data = hotspots.map(h => h.deforestation.co2_equivalent_tonnes);

    const lineConfig = {
        labels,
        datasets: [
            {
                label: 'Flood Probability',
                data: floodData,
                borderColor: '#0ea5e9',
                backgroundColor: 'rgba(14, 165, 233, 0.05)',
                borderWidth: 4,
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointBackgroundColor: '#0ea5e9',
            },
            {
                label: 'Wildfire Risk',
                data: fireData,
                borderColor: '#f43f5e',
                backgroundColor: 'rgba(244, 63, 94, 0.05)',
                borderWidth: 4,
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointBackgroundColor: '#f43f5e',
            }
        ]
    };

    const barConfig = {
        labels,
        datasets: [{
            label: 'CO2e Tonnes',
            data: co2Data,
            backgroundColor: '#10b981',
            borderRadius: 8,
            barThickness: 24,
        }]
    };

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top',
                align: 'end',
                labels: {
                    usePointStyle: true,
                    font: { weight: 'bold', size: 10 }
                }
            },
            tooltip: {
                backgroundColor: '#ffffff',
                titleColor: '#0f172a',
                bodyColor: '#64748b',
                padding: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#e2e8f0',
                bodyFont: { size: 12 },
                boxPadding: 6,
                usePointStyle: true,
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { font: { size: 10, weight: 'bold' }, color: '#94a3b8' }
            },
            y: {
                grid: { color: '#f1f5f9', drawBorder: false },
                ticks: { font: { size: 10 }, color: '#94a3b8', padding: 8 }
            }
        }
    };

    return (
        <div className="flex flex-col gap-8 max-w-7xl mx-auto">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <AnalyticCard
                    title="Total Area Monitored"
                    value="12.4M"
                    unit="ha"
                    icon={<BarChart3 className="text-accent-indigo" />}
                    trend="+2.4%"
                />
                <AnalyticCard
                    title="Avg Fire Risk"
                    value={(fireData.reduce((a, b) => a + b, 0) / fireData.length).toFixed(1)}
                    unit="%"
                    icon={<ShieldAlert className="text-accent-rose" />}
                    trend="-0.8%"
                    trendColor="text-emerald-500"
                />
                <AnalyticCard
                    title="Avg Flood Prob"
                    value={(floodData.reduce((a, b) => a + b, 0) / floodData.length).toFixed(1)}
                    unit="%"
                    icon={<Waves className="text-accent-sky" />}
                    trend="+1.2%"
                    trendColor="text-rose-500"
                />
                <AnalyticCard
                    title="Total Carbon Release"
                    value={co2Data.reduce((a, b) => a + b, 0).toFixed(0)}
                    unit="t"
                    icon={<TreePine className="text-accent-emerald" />}
                    trend="+142t"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[450px]">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Threat Correlation Analysis</h3>
                            <p className="text-sm text-slate-400 font-medium">Monitoring fire risk vs flood probability over active regions</p>
                        </div>
                        <div className="flex gap-2">
                            <button className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-500">24H</button>
                            <button className="px-3 py-1.5 rounded-lg bg-primary text-white text-[10px] font-bold">7D</button>
                        </div>
                    </div>
                    <div className="flex-1 min-h-0">
                        <Line data={lineConfig} options={commonOptions} />
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[450px]">
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-slate-800">Carbon Impact</h3>
                        <p className="text-sm text-slate-400 font-medium">CO2e emissions by jurisdiction</p>
                    </div>
                    <div className="flex-1 min-h-0">
                        <Bar data={barConfig} options={commonOptions} />
                    </div>
                    <div className="mt-8 pt-8 border-t border-slate-100 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-accent-amber/10 flex items-center justify-center text-accent-amber">
                            <AlertCircle size={24} />
                        </div>
                        <div className="flex-1">
                            <div className="text-xs font-bold text-slate-700">Critical Alert</div>
                            <div className="text-[10px] text-slate-400 font-medium">35% increase in Boreal carbon release.</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AnalyticCard = ({ title, value, unit, icon, trend, trendColor = "text-slate-400" }) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                {icon}
            </div>
            <div className={`text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-50 ${trendColor}`}>
                {trend}
            </div>
        </div>
        <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</div>
            <div className="flex items-baseline gap-1">
                <div className="text-2xl font-black text-slate-800">{value}</div>
                <div className="text-xs font-bold text-slate-400">{unit}</div>
            </div>
        </div>
    </div>
);

export default AnalyticsHub;

