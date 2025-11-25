
import React, { useState } from 'react';
import { ViewState } from '../types';

interface NavigationProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  toggleTheme: () => void;
  currentTheme: 'dark' | 'light';
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, setView, toggleTheme, currentTheme }) => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: ViewState.DASHBOARD, label: 'Reception' },
    { id: ViewState.LOG, label: 'Cinema Log' },
    { id: ViewState.STATS, label: 'Data Analytics' },
    { id: ViewState.ORACLE, label: 'The Oracle' },
    { id: ViewState.SETTINGS, label: 'Maanagement' },
  ];

  const handleNavClick = (view: ViewState) => {
    setView(view);
    setIsOpen(false);
  };

  return (
    <nav className="flex flex-col w-full md:w-64 bg-tbhc-bgWX border-b md:border-b-0 md:border-r border-tbhc-gold/20 h-auto md:h-screen sticky top-0 z-50 transition-colors duration-300 bg-tbhc-bg">
      <div className="flex items-center justify-between p-6 border-b md:border-b-0 border-tbhc-gold/10">
        <div>
          <h1 className="font-serif text-2xl text-tbhc-gold tracking-widest">STAR TREATMENT</h1>
          <p className="text-xs text-tbhc-cream/60 mt-1 uppercase tracking-widest">Movie Night Tracker</p>
        </div>
        
        <div className="flex items-center gap-2">
            {/* Theme Toggle Mobile */}
             <button 
                onClick={toggleTheme}
                className="md:hidden text-tbhc-cream/50 hover:text-tbhc-gold p-2 transition-colors"
                title="Toggle Theme"
             >
                {currentTheme === 'dark' ? (
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                ) : (
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                )}
             </button>

            {/* Mobile Hamburger Menu Button */}
            <button 
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-tbhc-gold focus:outline-none p-2 hover:bg-white/5 rounded transition-colors"
            aria-label="Toggle menu"
            >
            {isOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
            </button>
        </div>
      </div>
      
      {/* Navigation Items Container */}
      <div className={`
        ${isOpen ? 'flex' : 'hidden'} 
        md:flex flex-col flex-1 
        absolute md:static top-full left-0 w-full md:w-auto 
        bg-tbhc-bg md:bg-transparent 
        border-b md:border-b-0 border-tbhc-gold/20 
        shadow-2xl md:shadow-none
      `}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            className={`text-left px-6 py-4 transition-all duration-300 border-l-4 ${
              currentView === item.id
                ? 'border-tbhc-gold bg-tbhc-gold/10 text-tbhc-gold'
                : 'border-transparent text-tbhc-cream/60 hover:text-tbhc-cream hover:bg-white/5'
            }`}
          >
            <span className="font-sans text-sm uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
        
        {/* Mobile Version Info in Drawer */}
        <div className="p-6 md:hidden">
            <div className="text-xs text-tbhc-cream/20 font-mono">
            v1.2.0 <br/>
            TBHC-OS
            </div>
        </div>
      </div>

      {/* Desktop Footer with Theme Toggle */}
      <div className="p-6 hidden md:flex items-center justify-between mt-auto border-t border-tbhc-gold/10">
        <div className="text-xs text-tbhc-cream/20 font-mono">
          v1.2.0 <br/>
          TBHC-OS
        </div>
        <button 
           onClick={toggleTheme}
           className="text-tbhc-cream/30 hover:text-tbhc-gold transition-colors p-2SX rounded-full hover:bg-white/5"
           title={currentTheme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
             {currentTheme === 'dark' ? (
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
        </button>
      </div>
    </nav>
  );
};