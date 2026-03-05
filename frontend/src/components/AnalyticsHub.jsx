import React from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
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
    Title,
    Tooltip,
    Legend,
    Filler
);

const AnalyticsHub = ({ data }) => {
    if (!data) return null;

    const hotspots = data.hotspots;
    const labels = hotspots.map(h => h.region.split('/')[0].trim());
    const chartData = hotspots.map(h => h.flood.probability * 100);

    const config = {
        labels,
        datasets: [{
            label: 'Flood Prob %',
            data: chartData,
            borderColor: '#00d4ff',
            backgroundColor: 'rgba(0, 212, 255, 0.1)',
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointBackgroundColor: '#00d4ff',
            pointBorderColor: 'rgba(255,255,255,0.5)',
            pointBorderWidth: 2,
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(13, 17, 23, 0.95)',
                titleFont: { family: 'Orbitron', size: 10 },
                bodyFont: { family: 'Inter', size: 12 },
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)'
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: '#64748b', font: { size: 9 } }
            },
            y: {
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: { color: '#64748b', font: { size: 9 }, stepSize: 20 },
                min: 0,
                max: 100
            }
        }
    };

    return (
        <div className="glass-panel absolute right-5 bottom-5 w-[400px] z-50 p-6 rounded-[20px]">
            <div className="flex items-center gap-2 text-[0.7rem] uppercase tracking-[2px] text-text-secondary mb-4">
                Temporal Analysis (24h)
                <div className="flex-1 h-px bg-white/10" />
            </div>
            <div className="h-[180px] w-full">
                <Line data={config} options={options} />
            </div>
        </div>
    );
};

export default AnalyticsHub;
