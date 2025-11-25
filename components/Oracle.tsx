import React, { useState } from 'react';
import { AppData, Participant } from '../types';
import { generateTasteProfile, generateGroupRecommendations, generatePersonalRecommendations } from '../services/geminiService';

interface OracleProps {
  data: AppData;
}

type Mode = 'PROFILE' | 'RECOMMEND';

export const Oracle: React.FC<OracleProps> = ({ data }) => {
  const [mode, setMode] = useState<Mode>('PROFILE');
  const [selectedParticipant, setSelectedParticipant] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleProfileAnalysis = async () => {
      if (!selectedParticipant) return;
      setLoading(true);
      setResult(null);
      
      try {
        const p = data.participants.find(part => part.id === selectedParticipant);
        if (!p) return;

        const userRatings = data.movies.map(m => {
          const r = m.ratings.find(rat => rat.userId === p.id);
          return r ? { title: m.title, score: r.score, genres: m.genres } : null;
        }).filter(item => item !== null) as {title: string, score: number, genres?: string[]}[];

        if (userRatings.length < 3) {
          setResult([{ title: "Insufficient Data", year: "N/A", pitch: "This subject requires more observation (min 3 ratings)."}]);
          setLoading(false);
          return;
        }

        const recommendations = await generatePersonalRecommendations(p.name, userRatings);
        setResult(recommendations);
      } catch (e) {
        setResult([{ title: "Error", year: "N/A", pitch: "Error communicating with the mainframe."}]);
        console.error(e);
      }
      setLoading(false);
  };

  const handleRecommendations = async () => {
    setLoading(true);
    setResult(null);
    try {
        const movieStats = data.movies.map(m => {
            const avg = m.ratings.reduce((a,b) => a + b.score, 0) / (m.ratings.length || 1);
            return { title: m.title, avgScore: avg, genres: m.genres };
        });

        if (movieStats.length < 3) {
            setResult([{ title: "Watch more movies", year: "Now", pitch: "Collect more data to enable the algorithm."}]);
            setLoading(false);
            return;
        }

        const recs = await generateGroupRecommendations(movieStats);
        setResult(recs);
    } catch (e) {
        setResult([]); // Handle error gracefully
        console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="p-6 md:p-12 max-w-5xl mx-auto animate-fade-in min-h-screen">
       <div className="flex flex-col items-center justify-center mb-12 text-center">
         <div className="w-16 h-16 rounded-full bg-tbhc-gold/10 flex items-center justify-center border border-tbhc-gold animate-pulse mb-4">
            <svg className="w-8 h-8 text-tbhc-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
         </div>
         <h2 className="font-serif text-4xl md:text-5xl text-tbhc-cream tracking-wider">THE ORACLE</h2>
         <p className="text-tbhc-gold/60 font-mono text-xs uppercase tracking-widest mt-2">Algorithmic Insight Engine</p>
       </div>

       {/* Mode Switcher */}
       <div className="flex justify-center mb-12">
          <div className="bg-white/5 p-1 rounded-lg flex gap-1 border border-white/5">
              <button 
                onClick={() => { setMode('PROFILE'); setResult(null); }}
                className={`px-6 py-2 rounded-md text-sm uppercase tracking-wider transition-all ${mode === 'PROFILE' ? 'bg-tbhc-gold text-tbhc-bg font-bold' : 'text-tbhc-cream/50 hover:text-tbhc-cream'}`}
              >
                Taste Profile
              </button>
              <button 
                onClick={() => { setMode('RECOMMEND'); setResult(null); }}
                className={`px-6 py-2 rounded-md text-sm uppercase tracking-wider transition-all ${mode === 'RECOMMEND' ? 'bg-tbhc-gold text-tbhc-bg font-bold' : 'text-tbhc-cream/50 hover:text-tbhc-cream'}`}
              >
                Recommendations
              </button>
          </div>
       </div>

       <div className="max-w-2xl mx-auto bg-tbhc-card border border-tbhc-gold/20 rounded-xl p-8 shadow-2xl relative overflow-hidden">
          {/* Scanlines */}
          <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))]" style={{backgroundSize: "100% 2px, 3px 100%"}}></div>

          {mode === 'PROFILE' && (
             <div className="relative z-10 space-y-6">
                <p className="text-center text-tbhc-cream/60 font-serif italic">Select a subject for psychographic analysis.</p>
                <div className="flex gap-2">
                    <select 
                      value={selectedParticipant}
                      onChange={(e) => setSelectedParticipant(e.target.value)}
                      className="flex-1 bg-black/30 border border-white/10 rounded px-4 py-3 text-tbhc-cream focus:border-tbhc-gold outline-none"
                    >
                        <option value="">Select Participant...</option>
                        {data.participants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <button 
                      onClick={handleProfileAnalysis}
                      disabled={!selectedParticipant || loading}
                      className="bg-tbhc-gold text-tbhc-bg px-6 py-3 rounded font-bold uppercase tracking-wider hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Analyze
                    </button>
                </div>
             </div>
          )}

          {mode === 'RECOMMEND' && (
              <div className="relative z-10 space-y-6 text-center">
                 <p className="text-tbhc-cream/60 font-serif italic">Compute the next optimal screening based on group resonance.</p>
                 <button 
                      onClick={handleRecommendations}
                      disabled={loading}
                      className="bg-tbhc-gold text-tbhc-bg px-8 py-3 rounded font-bold uppercase tracking-wider hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[0_0_15px_rgba(203,161,99,0.3)]"
                    >
                        Predict Next Watch
                    </button>
              </div>
          )}

          {/* RESULTS DISPLAY */}
          <div className="mt-8 pt-8 border-t border-dashed border-white/10 min-h-[120px] relative z-10">
              {loading ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                      <div className="w-8 h-8 border-2 border-tbhc-gold border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-mono text-tbhc-gold animate-pulse">PROCESSING DATA STREAMS...</span>
                  </div>
              ) : result ? (
                  mode === 'PROFILE' ? (
                      <div className="font-mono text-tbhc-cream text-sm leading-relaxed whitespace-pre-wrap animate-fade-in">
                          {typeof result === 'string' ? result : JSON.stringify(result)}
                      </div>
                  ) : (
                      <div className="grid gap-6 animate-fade-in">
                          {(result as any[]).map((rec, idx) => (
                              <div key={idx} className="bg-white/5 p-4 rounded border-l-2 border-tbhc-gold">
                                  <div className="flex justify-between items-baseline mb-2">
                                      <h4 className="text-lg font-serif text-tbhc-gold">{rec.title}</h4>
                                      <span className="text-xs font-mono text-tbhc-cream/40">{rec.year}</span>
                                  </div>
                                  <p className="text-sm text-tbhc-cream/80 leading-relaxed">"{rec.pitch}"</p>
                              </div>
                          ))}
                      </div>
                  )
              ) : (
                  <div className="text-center text-tbhc-cream/20 font-mono text-xs py-8">
                      AWAITING INPUT...
                  </div>
              )}
          </div>
       </div>
    </div>
  );
};
