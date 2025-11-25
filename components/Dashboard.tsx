
import React, { useState, useEffect } from 'react';
import { AppData, Movie } from '../types';

interface DashboardProps {
  data: AppData;
  onNavigateToLog: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ data, onNavigateToLog }) => {
  
  const recentMovies = [...data.movies].sort((a, b) => 
    new Date(b.dateWatched).getTime() - new Date(a.dateWatched).getTime()
  ).slice(0, 3);

  // QUOTE CAROUSEL LOGIC
  const lastFiveQuotes = [...data.movies]
    .sort((a, b) => new Date(b.dateWatched).getTime() - new Date(a.dateWatched).getTime())
    .slice(0, 5)
    .filter(m => m.quote); // Ensure we only take ones with quotes

  // If no quotes, fallback
  const displayQuotes = lastFiveQuotes.length > 0 
    ? lastFiveQuotes 
    : [{ quote: "Information Action Ratio", title: "Tranquility Base" } as Movie];

  const [quoteIndex, setQuoteIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isFading, setIsFading] = useState(false);
  
  const currentQuoteObj = displayQuotes[quoteIndex];
  const fullQuoteText = currentQuoteObj.quote || "Information Action Ratio";

  // Typing & Cycling Effect
  useEffect(() => {
    let typingTimeout: ReturnType<typeof setTimeout>;
    let cycleTimeout: ReturnType<typeof setTimeout>;

    // Reset for new quote
    if (displayedText === '' && !isFading) {
      let charIndex = 0;
      const typeChar = () => {
        if (charIndex < fullQuoteText.length) {
          setDisplayedText(fullQuoteText.slice(0, charIndex + 1));
          charIndex++;
          // Randomized typing speed for human feel (30ms - 70ms)
          typingTimeout = setTimeout(typeChar, Math.random() * 40 + 30); 
        } else {
          // Finished typing, hold for a few seconds then fade
          cycleTimeout = setTimeout(() => {
            setIsFading(true);
          }, 4000); // Read time
        }
      };
      typeChar();
    }

    return () => {
      clearTimeout(typingTimeout);
      clearTimeout(cycleTimeout);
    };
  }, [quoteIndex, isFading, fullQuoteText]);

  // Handle Fade Out completion
  useEffect(() => {
    let fadeTimeout: ReturnType<typeof setTimeout>;
    if (isFading) {
      fadeTimeout = setTimeout(() => {
        // Switch quote
        setQuoteIndex((prev) => (prev + 1) % displayQuotes.length);
        setDisplayedText('');
        setIsFading(false);
      }, 1000); // Match CSS transition duration
    }
    return () => clearTimeout(fadeTimeout);
  }, [isFading, displayQuotes.length]);


  const getAverageRating = (movie: Movie) => {
    if (movie.ratings.length === 0) return '0';
    const sum = movie.ratings.reduce((acc, r) => acc + r.score, 0);
    return (sum / movie.ratings.length).toFixed(1);
  };

  return (
    <div className="p-6 md:p-12 max-w-6xl mx-auto animate-fade-in">
      <header className="mb-12 relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <h2 className="font-serif text-4xl md:text-6xl text-tbhc-cream">Four Stars Out of Five</h2>
        </div>
        
        {/* RETRO TYPEWRITER QUOTE BOX */}
        <div className="border-l-2 border-tbhc-gold pl-6 py-4 bg-tbhc-gold/5 min-h-[120px] flex flex-col justify-center relative overflow-hidden">
           <div className={`transition-opacity duration-1000 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
              <p className="font-mono text-tbhc-gold text-lg md:text-xl leading-relaxed">
                "{displayedText}<span className="animate-pulse text-tbhc-rust">_</span>"
              </p>
              <p className="text-xs text-tbhc-cream/40 uppercase tracking-widest mt-3 font-sans">
                — {currentQuoteObj.title}
              </p>
           </div>
           {/* Scanline effect overlay */}
           <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-10 pointer-events-none" style={{backgroundSize: '100% 4px'}}></div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {/* Stat Card 1 */}
        <div className="bg-tbhc-card p-6 rounded-lg border border-white/5 shadow-lg">
          <h3 className="text-tbhc-cream/60 uppercase tracking-widest text-xs mb-2">Total Screenings</h3>
          <p className="font-serif text-5xl text-tbhc-gold">{data.movies.length}</p>
        </div>
         {/* Stat Card 2 */}
         <div className="bg-tbhc-card p-6 rounded-lg border border-white/5 shadow-lg">
          <h3 className="text-tbhc-cream/60 uppercase tracking-widest text-xs mb-2">Group Average</h3>
          <p className="font-serif text-5xl text-tbhc-rust">
            {data.movies.length > 0 
              ? (data.movies.reduce((acc, m) => acc + parseFloat(getAverageRating(m)), 0) / data.movies.length).toFixed(1)
              : '-'}
          </p>
        </div>
         {/* Stat Card 3 */}
         <div className="bg-tbhc-card p-6 rounded-lg border border-white/5 shadow-lg">
          <h3 className="text-tbhc-cream/60 uppercase tracking-widest text-xs mb-2">Active Members</h3>
          <p className="font-serif text-5xl text-tbhc-gold">{data.participants.length}</p>
        </div>
      </div>

      <h3 className="font-serif text-2xl text-tbhc-cream mb-6">Recent Screenings</h3>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {recentMovies.map((movie) => (
          <div key={movie.id} className="group relative bg-tbhc-card rounded-xl overflow-hidden border border-white/5 hover:border-tbhc-gold/50 transition-all duration-300">
            <div className="aspect-video w-full bg-black relative overflow-hidden">
              {/* Fallback Background (z-0) */}
              <div className="absolute inset-0 flex items-center justify-center bg-tbhc-gold/10 z-0">
                  <span className="text-tbhc-gold text-4xl font-serif">?</span>
              </div>

              {/* Poster Image (z-10) - Fully opaque to cover fallback */}
              {movie.posterUrl && (
                <img 
                  src={movie.posterUrl} 
                  alt={movie.title} 
                  className="absolute inset-0 w-full h-full object-cover z-10" 
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}

              {/* Dimming Overlay (z-20) - Controls the visual tint/dimming */}
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-500 z-20 pointer-events-none" />

              {/* Content (z-30) */}
              <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black to-transparent p-4 z-30">
                 <div className="flex justify-between items-end">
                    <span className="text-xs font-mono text-tbhc-gold border border-tbhc-gold px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm">
                      {movie.releaseYear || 'Unknown'}
                    </span>
                    <span className="font-serif text-3xl text-white drop-shadow-lg">{getAverageRating(movie)}</span>
                 </div>
              </div>
            </div>
            <div className="p-5">
              <h4 className="font-serif text-xl text-tbhc-cream truncate">{movie.title}</h4>
              <p className="text-xs text-tbhc-cream/50 uppercase tracking-wider mt-1 mb-3">
                Selected by {data.participants.find(p => p.id === movie.selectorId)?.name || 'Unknown'}
              </p>
              <p className="text-sm text-tbhc-cream/70 line-clamp-2 font-light">
                {movie.synopsis || "No synopsis available."}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 text-center">
        <button 
          onClick={onNavigateToLog}
          className="text-tbhc-gold hover:text-white font-sans text-sm uppercase tracking-widest border-b border-tbhc-gold pb-1 transition-colors"
        >
          View Full Log &rarr;
        </button>
      </div>
    </div>
  );
};
