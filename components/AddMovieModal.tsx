
import React, { useState, useEffect } from 'react';
import { AppData, Movie, Rating } from '../types';
import { fetchMovieMetadata } from '../services/geminiService';

interface AddMovieModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (movie: Movie) => void;
  onDelete?: (movieId: string) => void;
  data: AppData;
  initialMovie?: Movie | null;
}

export const AddMovieModal: React.FC<AddMovieModalProps> = ({ isOpen, onClose, onSave, onDelete, data, initialMovie }) => {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [year, setYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchedData, setFetchedData] = useState<Partial<Movie>>({});
  const [selectorId, setSelectorId] = useState('');
  const [dateWatched, setDateWatched] = useState(new Date().toISOString().split('T')[0]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [attendees, setAttendees] = useState<Set<string>>(new Set());
  const [quote, setQuote] = useState('');
  const [director, setDirector] = useState('');
  const [venue, setVenue] = useState('');

  // Reset or Initialize when modal opens/closes or initialMovie changes
  useEffect(() => {
    if (isOpen) {
      if (initialMovie) {
        // EDIT MODE
        setStep(2);
        setTitle(initialMovie.title);
        setYear(initialMovie.releaseYear || '');
        setFetchedData({
            title: initialMovie.title,
            posterUrl: initialMovie.posterUrl,
            synopsis: initialMovie.synopsis,
            runtime: initialMovie.runtime,
            director: initialMovie.director,
            releaseYear: initialMovie.releaseYear,
            genres: initialMovie.genres,
            officialRating: initialMovie.officialRating,
        });
        setQuote(initialMovie.quote || '');
        setDirector(initialMovie.director || '');
        setVenue(initialMovie.venue || '');
        setSelectorId(initialMovie.selectorId);
        setDateWatched(initialMovie.dateWatched);
        setRatings(initialMovie.ratings);
        // Determine attendees based on existing ratings
        const attendeeIds = new Set(initialMovie.ratings.map(r => r.userId));
        setAttendees(attendeeIds);
      } else {
        // ADD MODE
        setStep(1);
        setTitle('');
        setYear('');
        setFetchedData({});
        setQuote('');
        setDirector('');
        setVenue('');
        setSelectorId('');
        setDateWatched(new Date().toISOString().split('T')[0]);
        setRatings([]);
        // Default: All current participants attended
        setAttendees(new Set(data.participants.map(p => p.id)));
      }
    }
  }, [isOpen, initialMovie, data.participants]);

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!title) return;
    setLoading(true);
    // Fetch Metadata, passing title, year, AND director hint
    const metadata = await fetchMovieMetadata(title, year, director);
    setFetchedData({ ...metadata });
    
    // If metadata came back with a proper title, use it
    if (metadata.title) {
        setTitle(metadata.title);
    }
    if (metadata.quote) {
        setQuote(metadata.quote);
    }
    // If API found a director, use it, otherwise keep what the user typed
    if (metadata.director) {
        setDirector(metadata.director);
    }

    setLoading(false);
    setStep(2);
    
    // Initialize ratings for all participants (default to 2.5 for 5-star scale)
    const allIds = new Set(data.participants.map(p => p.id));
    setAttendees(allIds);
    const initialRatings = data.participants.map(p => ({ userId: p.id, score: 2.5 }));
    setRatings(initialRatings);
  };

  const handleSave = () => {
    if (!selectorId) {
      alert("Who picked the movie?");
      return;
    }
    
    // Filter ratings to only include attendees
    const finalRatings = ratings.filter(r => attendees.has(r.userId));

    const movieToSave: Movie = {
      id: initialMovie?.id || Date.now().toString(),
      title: fetchedData.title || title, // Use fetched title for correct casing
      dateWatched,
      selectorId,
      posterUrl: fetchedData.posterUrl,
      synopsis: fetchedData.synopsis,
      runtime: fetchedData.runtime,
      director: director,
      releaseYear: fetchedData.releaseYear,
      genres: fetchedData.genres,
      officialRating: fetchedData.officialRating,
      quote: quote,
      venue: venue,
      ratings: finalRatings
    };
    onSave(movieToSave);
  };

  const toggleAttendee = (userId: string) => {
    const newAttendees = new Set(attendees);
    if (newAttendees.has(userId)) {
      newAttendees.delete(userId);
    } else {
      newAttendees.add(userId);
      if (!ratings.find(r => r.userId === userId)) {
        setRatings([...ratings, { userId, score: 2.5 }]);
      }
    }
    setAttendees(newAttendees);
  };

  const updateRating = (userId: string, score: number) => {
    setRatings(prev => {
      const existing = prev.find(r => r.userId === userId);
      if (existing) {
        return prev.map(r => r.userId === userId ? { ...r, score } : r);
      } else {
        return [...prev, { userId, score }];
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-tbhc-card w-full max-w-3xl rounded-xl border border-tbhc-gold/20 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-tbhc-gold/10 p-6 border-b border-tbhc-gold/10 flex-shrink-0">
          <h3 className="font-serif text-2xl text-tbhc-gold">{initialMovie ? 'Edit Log Entry' : 'Log New Screening'}</h3>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-tbhc-gold border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-tbhc-cream/60 font-mono text-sm animate-pulse">Interrogating the mainframe...</p>
            </div>
          ) : step === 1 ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-tbhc-cream/50 text-xs uppercase mb-2">Movie Title</label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full bg-black/20 border border-white/10 rounded p-4 text-xl text-tbhc-cream focus:border-tbhc-gold focus:outline-none font-serif"
                    placeholder="e.g. Blade Runner"
                    autoFocus
                  />
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="w-full md:w-32">
                        <label className="block text-tbhc-cream/50 text-xs uppercase mb-2">Year (Opt)</label>
                        <input 
                            type="text" 
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full bg-black/20 border border-white/10 rounded p-4 text-xl text-tbhc-cream focus:border-tbhc-gold focus:outline-none font-serif text-center"
                            placeholder="1982"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-tbhc-cream/50 text-xs uppercase mb-2">Director (Opt)</label>
                        <input 
                            type="text" 
                            value={director}
                            onChange={(e) => setDirector(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full bg-black/20 border border-white/10 rounded p-4 text-xl text-tbhc-cream focus:border-tbhc-gold focus:outline-none font-serif"
                            placeholder="e.g. Ridley Scott"
                        />
                    </div>
                </div>
              </div>
              <div className="text-xs text-tbhc-cream/40">
                * Metadata automatically retrieved via TMDB & Gemini.
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-6">
                 {/* Poster Preview with Fallback */}
                 <div className="w-32 mx-auto sm:mx-0 bg-black/40 rounded aspect-[2/3] flex-shrink-0 overflow-hidden relative">
                    <div className="absolute inset-0 flex items-center justify-center text-tbhc-cream/20 z-0">No Poster</div>
                    {fetchedData.posterUrl && (
                      <img 
                        src={fetchedData.posterUrl} 
                        alt="Poster" 
                        className="absolute inset-0 w-full h-full object-cover z-10" 
                        onError={(e) => e.currentTarget.style.display = 'none'}
                      />
                    )}
                 </div>
                 
                 <div className="flex-1 space-y-4">
                   <div>
                     <h4 className="text-xl font-serif text-tbhc-cream">{fetchedData.title || title}</h4>
                     <p className="text-sm text-tbhc-cream/60 mt-1 mb-2">
                       {fetchedData.releaseYear} • {fetchedData.runtime ? `${fetchedData.runtime} mins` : ''}
                       {director && ` • ${director}`}
                     </p>
                   </div>

                   {/* Editable Quote */}
                   <div>
                      <label className="block text-tbhc-cream/50 text-xs uppercase mb-1">Key Dialogue</label>
                      <textarea
                        value={quote}
                        onChange={(e) => setQuote(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded p-2 text-sm text-tbhc-gold italic focus:border-tbhc-gold focus:outline-none"
                        rows={2}
                        placeholder="Enter a memorable quote..."
                      />
                   </div>
                   
                   <p className="text-xs text-tbhc-cream/40 leading-relaxed line-clamp-2">{fetchedData.synopsis}</p>
                   
                   {fetchedData.officialRating && (
                      <div className="inline-block px-2 py-1 bg-white/5 border border-white/10 rounded text-tbhc-gold text-xs font-mono">
                        {fetchedData.officialRating} <span className="text-tbhc-gold/80 border border-tbhc-gold/30 px-1.5 rounded-sm whitespace-nowrap">IMDb</span>
                      </div>
                   )}
                   
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-tbhc-cream/50 text-xs uppercase mb-1">Selector</label>
                        <div className="relative">
                            <select 
                            value={selectorId}
                            onChange={(e) => setSelectorId(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded p-2 text-tbhc-cream text-sm appearance-none"
                            >
                            <option value="">Select person...</option>
                            {data.participants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-tbhc-cream/50 text-xs uppercase mb-1">Date</label>
                        <input 
                          type="date"
                          value={dateWatched}
                          onChange={(e) => setDateWatched(e.target.value)}
                          className="w-full bg-black/20 border border-white/10 rounded p-2 text-tbhc-cream text-sm"
                        />
                      </div>
                   </div>

                   {/* NEW: Venue Input */}
                   <div>
                      <label className="block text-tbhc-cream/50 text-xs uppercase mb-1">Venue / Location</label>
                      <input 
                        type="text" 
                        value={venue}
                        onChange={(e) => setVenue(e.target.value)}
                        placeholder="e.g. Alamo Drafthouse, Home, Rooftop Cinema"
                        className="w-full bg-black/20 border border-white/10 rounded p-2 text-tbhc-cream text-sm"
                        list="venues"
                      />
                      <datalist id="venues">
                          <option value="Home" />
                          <option value="Alamo Drafthouse" />
                          <option value="AMC" />
                      </datalist>
                   </div>
                 </div>
              </div>

              {/* Attendance Selection */}
              <div className="border-t border-white/5 pt-4">
                <div className="flex justify-between items-center mb-3">
                   <h5 className="text-tbhc-cream/60 text-xs uppercase tracking-widest">Attendance</h5>
                   <span className="text-xs text-tbhc-cream/30">Who was there?</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.participants.map(p => {
                    const isAttending = attendees.has(p.id);
                    return (
                      <button 
                        key={p.id}
                        onClick={() => toggleAttendee(p.id)}
                        className={`px-3 py-1 rounded border text-sm transition-all flex items-center gap-2 ${
                          isAttending 
                          ? 'bg-tbhc-gold/20 border-tbhc-gold text-tbhc-gold' 
                          : 'bg-black/20 border-white/10 text-tbhc-cream/40 hover:border-white/30'
                        }`}
                      >
                        {p.avatarUrl ? (
                           <img src={p.avatarUrl} className="w-4 h-4 rounded-full object-cover" alt="" />
                        ) : null}
                        {p.name} {isAttending ? '✓' : ''}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Ratings */}
              <div className="border-t border-white/5 pt-4">
                <h5 className="text-tbhc-gold text-sm font-serif mb-3">Review Scores (0-5)</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Array.from(attendees).map(userId => {
                    const p = data.participants.find(part => part.id === userId);
                    if (!p) return null;
                    const currentRating = ratings.find(r => r.userId === p.id)?.score || 2.5;
                    return (
                      <div key={p.id} className="flex items-center justify-between bg-white/5 p-2 rounded border border-white/5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full overflow-hidden border border-white/10" style={{backgroundColor: p.avatarColor}}>
                            {p.avatarUrl && <img src={p.avatarUrl} alt="" className="w-full h-full object-cover" />}
                          </div>
                          <span className="text-tbhc-cream text-sm">{p.name}</span>
                        </div>
                        <input 
                          type="number" 
                          min="0" 
                          max="5" 
                          step="0.5"
                          value={currentRating}
                          onChange={(e) => updateRating(p.id, parseFloat(e.target.value))}
                          className="w-16 bg-black/30 border border-white/10 rounded p-1 text-center text-tbhc-gold focus:border-tbhc-gold focus:outline-none"
                        />
                      </div>
                    );
                  })}
                  {attendees.size === 0 && (
                    <div className="col-span-2 text-center text-tbhc-cream/30 text-sm italic">
                      Select attendees to add ratings.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-black/20 p-4 flex justify-between items-center gap-3 border-t border-white/5 flex-shrink-0">
           <div>
              {initialMovie && onDelete && (
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onDelete) onDelete(initialMovie.id);
                  }}
                  className="text-tbhc-rust hover:text-white text-sm uppercase tracking-wider px-4 transition-colors"
                >
                  Delete Entry
                </button>
              )}
           </div>
           <div className="flex gap-3">
             <button onClick={onClose} className="text-tbhc-cream/50 hover:text-tbhc-cream text-sm uppercase tracking-wider px-4">Cancel</button>
             {step === 1 ? (
               <button 
                 onClick={handleSearch}
                 disabled={!title}
                 className="bg-tbhc-gold text-tbhc-bg px-6 py-2 rounded font-medium hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 Search
               </button>
             ) : (
               <button 
                 onClick={handleSave}
                 className="bg-tbhc-gold text-tbhc-bg px-6 py-2 rounded font-medium hover:bg-white transition-colors"
               >
                 Save Entry
               </button>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};