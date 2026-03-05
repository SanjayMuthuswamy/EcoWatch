import React, { useState } from 'react';
import { useEcoData } from './hooks/useEcoData';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MapDisplay from './components/MapDisplay';
import AnalyticsHub from './components/AnalyticsHub';
import MapHUD from './components/MapHUD';
import { AnimatePresence, motion } from 'framer-motion';

function App() {
    const { data, loading } = useEcoData();
    const [activeTab, setActiveTab] = useState('all');

    return (
        <div className="relative h-screen w-screen bg-bg-base text-text-primary font-ui overflow-hidden flex flex-col">
            <AnimatePresence>
                {loading && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] bg-bg-base flex flex-col items-center justify-center"
                    >
                        <div className="w-20 h-20 border-4 border-white/10 border-t-accent-cyan rounded-full animate-spin" />
                        <div className="mt-6 font-header text-sm tracking-widest text-accent-cyan uppercase">
                            Initializing EcoWatch AI
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative h-full w-full flex">
                {/* Map is at the bottom layer */}
                <div className="absolute inset-0 z-0">
                    <MapDisplay data={data} activeTab={activeTab} />
                </div>

                {/* UI Overlays */}
                <Header />

                <Sidebar
                    data={data}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                />

                <MapHUD data={data} />

                <AnalyticsHub data={data} />
            </div>
        </div>
    );
}

export default App;
