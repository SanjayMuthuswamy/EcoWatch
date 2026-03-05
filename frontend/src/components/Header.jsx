import React, { useState, useEffect } from 'react';

const Header = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <header className="absolute top-5 left-5 right-5 h-16 z-50 flex items-center px-6 pointer-events-none">
            <div className="glass-panel absolute inset-0 z-[-1] rounded-[20px] pointer-events-auto" />

            <div className="flex items-center gap-3 pointer-events-auto">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-emerald to-accent-cyan grid place-items-center text-bg-base font-black text-lg">
                    E
                </div>
                <div className="font-header text-xl tracking-wider uppercase">
                    Eco<span className="text-accent-cyan">Watch</span> AI
                </div>
            </div>

            <div className="ml-8 text-[0.75rem] flex items-center gap-2 text-text-secondary pointer-events-auto">
                <div className="w-2 h-2 rounded-full bg-accent-emerald shadow-[0_0_8px_#00ff9d] animate-breathe" />
                SYSTEM ONLINE
            </div>

            <div className="ml-auto font-mono text-[0.9rem] text-text-secondary tracking-widest pointer-events-auto">
                {time.toLocaleTimeString('en-GB', { hour12: false })}
            </div>
        </header>
    );
};

export default Header;
