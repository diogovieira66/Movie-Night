import React, { useState } from 'react';
import { AppData, Movie } from '../types';

interface MovieLogProps {
  data: AppData;
  onEditMovie: (movie: Movie) => void;
  onDeleteMovie: (movieId: string) => void;
}

export const MovieLog: React.FC<MovieLogProps> = ({ data, onEditMovie, onDeleteMovie }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sort, setSort] = useState<'date' | 'rating'>('date');

  const getAverageRating = (movie: Movie) => {
    if (movie.ratings.length === 0) return 0;
    return movie.ratings.reduce((acc, r) => acc + r.score, 0) / movie.ratings.length;
  };

  const filteredMovies = data.movies
    .filter(m => m.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'date') {
        return new Date(b.dateWatched).getTime() - new Date(a.dateWatched).getTime();
      } else {
        return getAverageRating(b) - getAverageRating(a);
      }
    });

  return (
    <div className="p-6 md:p-12 w-full max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4">
        <div>
          <h2 className="font-serif text-4xl text-tbhc-cream">Cinema Log</h2>
          <p className="text-tbhc-cream/40 text-sm mt-1 font-light">Archive of visual experiences</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-center">
           <div className="flex gap-2 w-full sm:w-auto">
               <input 
                 type="text" 
                 placeholder="Search archives..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="bg-tbhc-card border border-white/10 rounded px-4 py-2 text-tbhc-cream focus:outline-none focus:border-tbhc-gold w-full md:w-48 text-sm"
               />
               <select 
                 value={sort}
                 onChange={(e) => setSort(e.target.value as 'date' | 'rating')}
                 className="bg-tbhc-card border border-white/10 rounded px-4 py-2 text-tbhc-cream focus:outline-none focus:border-tbhc-gold text-sm"
               >
                 <option value="date">Date</option>
                 <option value="rating">Rating</option>
               </select>
           </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredMovies.map((movie) => (
            <div key={movie.id} className="group bg-tbhc-card rounded-lg p-6 border border-white/5 flex flex-col md:flex-row gap-6 hover:bg-white/5 transition-colors relative">
                {/* Action Buttons */}
                <div className="absolute top-4 right-4 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <button 
                    onClick={() => onEditMovie(movie)}
                    className="text-tbhc-cream/20 hover:text-tbhc-gold transition-colors"
                    title="Edit Log"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button 
                    onClick={() => onDeleteMovie(movie.id)}
                    className="text-tbhc-cream/20 hover:text-tbhc-rust transition-colors"
                    title="Delete Log"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
                </div>

                {/* Poster Container with Fallback */}
                <div className="w-full md:w-32 h-48 flex-shrink-0 bg-black rounded overflow-hidden shadow-lg relative">
                {/* Fallback always present underneath */}
                <div className="absolute inset-0 flex items-center justify-center bg-tbhc-gold/10 text-tbhc-gold font-serif text-2xl z-0">
                    {movie.title[0]}
                </div>
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
                </div>
                
                <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-2xl font-serif text-tbhc-cream truncate pr-8">{movie.title}</h3>
                        <div className="flex flex-wrap gap-3 text-xs text-tbhc-cream/50 uppercase tracking-wider mt-1 items-center">
                        <span>{movie.releaseYear}</span>
                        <span>•</span>
                        <span>{movie.runtime} mins</span>
                        {movie.director && (
                            <>
                                <span>•</span>
                                <span>{movie.director}</span>
                            </>
                        )}
                        <span>•</span>
                        <span>{movie.genres?.slice(0, 2).join(', ')}</span>
                        {movie.officialRating && (
                            <>
                            <span className="hidden sm:inline">•</span>
                            <span className="bg-tbhc-rust text-white border border-tbhc-rust px-2 py-0.5 rounded-sm whitespace-nowrap font-medium">{movie.officialRating} <span className="opacity-70 text-[10px] ml-0.5">IMDb</span></span>
                            </>
                        )}
                        </div>
                    </div>
                    <div className="text-right hidden md:block">
                    <div className="text-3xl font-serif text-tbhc-gold">{getAverageRating(movie).toFixed(1)}</div>
                    <div className="text-xs text-tbhc-cream/40 uppercase">Group Avg</div>
                    </div>
                </div>
                
                <p className="mt-4 text-tbhc-cream/70 font-light text-sm leading-relaxed line-clamp-2">
                    {movie.synopsis}
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-between border-t border-white/5 pt-4 gap-4">
                    <div className="flex -space-x-2 overflow-hidden py-1 pl-1">
                    {movie.ratings.map((rating, idx) => {
                        const p = data.participants.find(p => p.id === rating.userId);
                        if (!p) return null;
                        return (
                        <div 
                            key={idx} 
                            className="w-10 h-10 rounded-full border-2 border-tbhc-card flex items-center justify-center text-xs font-bold text-tbhc-bg relative hover:z-10 transition-all hover:scale-110 cursor-default overflow-hidden" 
                            style={{ backgroundColor: p.avatarColor }} 
                            title={`${p.name}: ${rating.score}`}
                        >
                            {p.avatarUrl && <img src={p.avatarUrl} alt={p.name} className="absolute inset-0 w-full h-full object-cover opacity-80" />}
                            <span className="relative z-10 drop-shadow-md text-white font-sans text-sm">{rating.score}</span>
                        </div>
                        );
                    })}
                    </div>
                    
                    {/* Mobile Rating Display */}
                    <div className="md:hidden flex items-center gap-2">
                        <div className="text-xl font-serif text-tbhc-gold">{getAverageRating(movie).toFixed(1)}</div>
                        <div className="text-xs text-tbhc-cream/40 uppercase">Avg</div>
                    </div>

                    <div className="flex items-center gap-4">
                        {movie.venue && (
                            <div className="flex items-center gap-1 text-xs text-tbhc-cream/40 uppercase tracking-widest">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                {movie.venue}
                            </div>
                        )}
                        <div className="text-xs text-tbhc-cream/30 font-mono">
                            {new Date(movie.dateWatched).toLocaleDateString()}
                        </div>
                    </div>
                </div>
                </div>
            </div>
        ))}

        {filteredMovies.length === 0 && (
           <div className="col-span-full text-center py-20 text-tbhc-cream/30 font-serif italic">
             No records found in the archives.
           </div>
        )}
      </div>
    </div>
  );
};