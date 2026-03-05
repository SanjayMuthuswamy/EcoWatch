import React, { useState, useEffect } from 'react';
import { Globe, BarChart3, Bell, Settings, Search } from 'lucide-react';

const Header = ({ currentView, setCurrentView }) => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <nav className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between z-[100] relative shadow-sm">
            <div className="flex items-center gap-8">
                {/* Logo */}
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                        <Globe size={20} className="text-accent-sky" />
                    </div>
                    <div>
                        <div className="font-bold text-lg leading-tight tracking-tight">Eco<span className="text-accent-indigo">Watch</span></div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Intelligence Platform</div>
                    </div>
                </div>

                {/* Nav Links */}
                <div className="h-8 w-px bg-slate-200" />

                <div className="flex items-center gap-2">
                    <NavLink
                        active={currentView === 'map'}
                        onClick={() => setCurrentView('map')}
                        icon={<Globe size={18} />}
                        label="Live Map"
                    />
                    <NavLink
                        active={currentView === 'analytics'}
                        onClick={() => setCurrentView('analytics')}
                        icon={<BarChart3 size={18} />}
                        label="Analytics"
                    />
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500">
                    <Search size={14} />
                    <span className="text-xs font-medium">Search region...</span>
                    <span className="ml-4 px-1 rounded bg-slate-200 text-[10px]">⌘K</span>
                </div>

                <div className="flex items-center gap-4 text-slate-400">
                    <button className="hover:text-primary transition-colors relative">
                        <Bell size={20} />
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent-rose rounded-full border-2 border-white" />
                    </button>
                    <button className="hover:text-primary transition-colors">
                        <Settings size={20} />
                    </button>
                    <div className="h-6 w-px bg-slate-200" />
                    <div className="flex items-center gap-3 pl-2">
                        <div className="text-right hidden sm:block">
                            <div className="text-xs font-bold text-primary">Admin Terminal</div>
                            <div className="text-[10px] text-accent-emerald font-bold uppercase tracking-tighter flex items-center gap-1 justify-end">
                                <span className="w-1.5 h-1.5 rounded-full bg-accent-emerald animate-pulse" />
                                Secured
                            </div>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-bold overflow-hidden">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky" alt="avatar" />
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

const NavLink = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${active
                ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]'
                : 'text-slate-500 hover:bg-slate-50 hover:text-primary'
            }`}
    >
        {icon}
        {label}
    </button>
);

export default Header;

