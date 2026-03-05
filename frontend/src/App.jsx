import React, { useState } from 'react';
import { useEcoData } from './hooks/useEcoData';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MapDisplay from './components/MapDisplay';
import AnalyticsHub from './components/AnalyticsHub';
import MonitoringHub from './components/MonitoringHub';
import { AnimatePresence, motion } from 'framer-motion';

function App() {
    const { data, loading, sendTelegramTest } = useEcoData();
    const [activeTab, setActiveTab] = useState('all');
    const [currentView, setCurrentView] = useState('map'); // 'map', 'analytics', or 'alerts'
    const [selectedHotspot, setSelectedHotspot] = useState(null);

    return (
        <div className="h-screen w-screen bg-background flex flex-col overflow-hidden font-sans">
            <AnimatePresence>
                {loading && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center"
                    >
                        <div className="w-12 h-12 border-4 border-slate-100 border-t-accent-indigo rounded-full animate-spin" />
                        <div className="mt-4 font-medium text-slate-400 tracking-wider text-sm">
                            PREPARING INTELLIGENCE ENGINE...
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Application Header / Navbar */}
            <Header currentView={currentView} setCurrentView={setCurrentView} />

            <div className="flex-1 flex overflow-hidden relative">
                {/* Collapsible Sidebar */}
                <Sidebar
                    data={data}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    setSelectedHotspot={(hs) => {
                        setSelectedHotspot(hs);
                        setCurrentView('analytics');
                    }}
                />

                {/* Content Area */}
                <main className="flex-1 relative bg-slate-50 flex flex-col">
                    <AnimatePresence mode="wait">
                        {currentView === 'map' ? (
                            <motion.div
                                key="map-view"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-0"
                            >
                                <MapDisplay
                                    data={data}
                                    activeTab={activeTab}
                                    onSelectHotspot={(hs) => {
                                        setSelectedHotspot(hs);
                                        setCurrentView('analytics');
                                    }}
                                />
                            </motion.div>
                        ) : currentView === 'analytics' ? (
                            <motion.div
                                key="analytics-view"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex-1 p-8 overflow-y-auto custom-scrollbar"
                            >
                                <AnalyticsHub
                                    data={data}
                                    selectedHotspot={selectedHotspot}
                                    isFullScreen={true}
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="monitoring-view"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex-1 p-8 overflow-y-auto custom-scrollbar"
                            >
                                <MonitoringHub data={data} sendTelegramTest={sendTelegramTest} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}

export default App;
