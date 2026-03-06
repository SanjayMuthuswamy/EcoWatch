import React, { useState, useEffect } from 'react';
import { Globe, BarChart3, Bell, Settings, Search, MapPin, Target, Activity, ChevronDown } from 'lucide-react';

const Header = ({ currentView, setCurrentView, searchQuery, setSearchQuery }) => {
    const [time, setTime] = useState(new Date());
    const [searchFocused, setSearchFocused] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const navItems = [
        { id: 'impact', icon: <Target size={15} />, label: 'Impact Sim' },
        { id: 'map', icon: <Globe size={15} />, label: 'Live Map' },
        { id: 'analytics', icon: <BarChart3 size={15} />, label: 'Analytics' },
        { id: 'alerts', icon: <Bell size={15} />, label: 'Monitoring' },
        { id: 'city-issues', icon: <MapPin size={15} />, label: 'City Issues' },
    ];

    return (
        <nav className="h-14 px-5 bg-white/80 backdrop-blur-xl border-b border-slate-200/70 flex items-center justify-between z-[100] relative">

            {/* ── LEFT: Brand ─────────────────────────────────── */}
            <div className="flex items-center gap-3 shrink-0">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-md shadow-primary/20">
                    <Globe size={16} className="text-accent-sky" />
                </div>
                <div className="leading-none">
                    <div className="font-bold text-[15px] tracking-tight text-primary">
                        EcoCity<span className="text-accent-indigo">Watch</span> <span className="text-[10px] font-black text-accent-sky ml-0.5">AI</span>
                    </div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-0.5">
                        Urban Intelligence Platform
                    </div>
                </div>
            </div>

            {/* ── CENTER: Primary Navigation ──────────────────── */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
                <div className="flex items-center gap-1 p-1 bg-slate-50/80 border border-slate-100 rounded-xl">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setCurrentView(item.id)}
                            className={`
                                flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold
                                transition-all duration-200 whitespace-nowrap
                                ${currentView === item.id
                                    ? 'bg-white text-primary shadow-sm border border-slate-200/80'
                                    : 'text-slate-400 hover:text-slate-600 hover:bg-white/50 border border-transparent'
                                }
                            `}
                        >
                            <span className={currentView === item.id ? 'text-accent-indigo' : ''}>{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── RIGHT: Utilities ────────────────────────────── */}
            <div className="flex items-center gap-3 shrink-0">
                {/* Search */}
                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 border rounded-lg transition-all duration-300 ${searchFocused ? 'border-accent-indigo/30 ring-2 ring-accent-indigo/10 w-44' : 'border-slate-200/80 w-36'}`}>
                    <Search size={13} className="text-slate-400 shrink-0" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                        className="bg-transparent border-none outline-none text-[11px] font-medium w-full text-slate-600 placeholder:text-slate-300"
                    />
                    <kbd className="hidden sm:inline text-[9px] font-bold text-slate-300 bg-slate-100 px-1 py-0.5 rounded border border-slate-200/50">⌘K</kbd>
                </div>

                {/* Separator */}
                <div className="h-5 w-px bg-slate-200/70" />

                {/* Quick Actions */}
                <div className="flex items-center gap-1">
                    <button className="relative w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-primary hover:bg-slate-50 transition-colors">
                        <Bell size={16} />
                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-accent-rose rounded-full ring-2 ring-white" />
                    </button>
                    <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-primary hover:bg-slate-50 transition-colors">
                        <Settings size={16} />
                    </button>
                </div>

                {/* Separator */}
                <div className="h-5 w-px bg-slate-200/70" />

                {/* Profile */}
                <div className="flex items-center gap-2 pl-1 cursor-pointer group">
                    <div className="text-right hidden sm:block leading-none">
                        <div className="text-[11px] font-bold text-slate-700 group-hover:text-primary transition-colors">Admin</div>
                        <div className="flex items-center gap-1 justify-end mt-0.5">
                            <span className="w-1 h-1 rounded-full bg-accent-emerald animate-pulse" />
                            <span className="text-[9px] font-bold text-accent-emerald uppercase tracking-wider">Secured</span>
                        </div>
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky" alt="avatar" className="w-full h-full object-cover" />
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Header;
