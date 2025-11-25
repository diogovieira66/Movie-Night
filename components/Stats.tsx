
import React, { useMemo } from 'react';
import { AppData, Movie, Participant } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

interface StatsProps {
  data: AppData;
}

export const Stats: React.FC<StatsProps> = ({ data }) => {
  // --- HELPER FUNCTIONS ---
  
  const getAverageRating = (movie: Movie) => {
    if (movie.ratings.length === 0) return 0;
    return movie.ratings.reduce((acc, r) => acc + r.score, 0) / movie.ratings.length;
  };

  const getMovieAvg = (m: Movie) => {
      if (!m.ratings.length) return 0;
      return m.ratings.reduce((a, b) => a + b.score, 0) / m.ratings.length;
  };

  // --- CALCULATIONS ---

  const stats = useMemo(() => {
    // 1. General Leaderboard Data
    const leaderboard = data.participants.map(p => {
      // Avg Given
      let totalGiven = 0;
      let countGiven = 0;
      data.movies.forEach(m => {
        const r = m.ratings.find(r => r.userId === p.id);
        if (r) {
          totalGiven += r.score;
          countGiven++;
        }
      });
      const avgGiven = countGiven === 0 ? 0 : totalGiven / countGiven;

      // Attendance
      const attendanceCount = data.movies.filter(m => m.ratings.some(r => r.userId === p.id)).length;

      return {
        ...p,
        avgGiven,
        attendanceCount
      };
    });

    // 2. Awards
    // Harshest Critic (Lowest Avg Given, min 2 ratings)
    const harshest = [...leaderboard]
      .filter(p => data.movies.reduce((acc, m) => acc + (m.ratings.some(r => r.userId === p.id) ? 1 : 0), 0) >= 2)
      .sort((a, b) => a.avgGiven - b.avgGiven)[0];

    // Most in Attendance
    const mostFrequent = [...leaderboard].sort((a, b) => b.attendanceCount - a.attendanceCount)[0];

    // All Time Best Picker
    const pickerStats: Record<string, { total: number, count: number }> = {};
    data.movies.forEach(m => {
      if (!pickerStats[m.selectorId]) pickerStats[m.selectorId] = { total: 0, count: 0 };
      pickerStats[m.selectorId].total += getMovieAvg(m);
      pickerStats[m.selectorId].count += 1;
    });

    let bestPicker = null;
    let bestPickerAvg = -1;

    Object.entries(pickerStats).forEach(([id, stat]) => {
      const avg = stat.total / stat.count;
      if (avg > bestPickerAvg && stat.count >= 1) { // Ensure at least one movie picked
        bestPickerAvg = avg;
        bestPicker = data.participants.find(p => p.id === id);
      }
    });

    // 3. Streaks (Current active streak of picking movies > 3.5, adjusted for 0-5 scale)
    const sortedMovies = [...data.movies].sort((a, b) => new Date(a.dateWatched).getTime() - new Date(b.dateWatched).getTime());
    const currentStreaks: Record<string, number> = {};
    
    // Initialize streaks
    data.participants.forEach(p => currentStreaks[p.id] = 0);

    sortedMovies.forEach(m => {
      const avg = getMovieAvg(m);
      if (avg >= 3.5) {
        currentStreaks[m.selectorId] = (currentStreaks[m.selectorId] || 0) + 1;
      } else {
        // Streak broken
        currentStreaks[m.selectorId] = 0;
      }
    });

    const streakList = Object.entries(currentStreaks)
      .map(([id, count]) => ({ participant: data.participants.find(p => p.id === id), count }))
      .filter(s => s.count > 0)
      .sort((a, b) => b.count - a.count);


    // 4. Synergy Matrix
    const matrix: Record<string, Record<string, number | null>> = {};
    let highestSynergy = { p1: null as Participant | null, p2: null as Participant | null, score: -1 };
    let lowestSynergy = { p1: null as Participant | null, p2: null as Participant | null, score: 101 };

    data.participants.forEach(p1 => {
      matrix[p1.id] = {};
      data.participants.forEach(p2 => {
        if (p1.id === p2.id) {
          matrix[p1.id][p2.id] = null;
          return;
        }

        let sharedCount = 0;
        let totalDiff = 0;

        data.movies.forEach(m => {
          const r1 = m.ratings.find(r => r.userId === p1.id);
          const r2 = m.ratings.find(r => r.userId === p2.id);
          if (r1 && r2) {
            sharedCount++;
            totalDiff += Math.abs(r1.score - r2.score);
          }
        });

        if (sharedCount > 0) {
          const avgDiff = totalDiff / sharedCount;
          const synergyScore = 100 * (1 - (avgDiff / 5)); // 0 diff = 100%, 5 diff = 0%
          matrix[p1.id][p2.id] = synergyScore;

          if (p1.id < p2.id) {
             if (synergyScore > highestSynergy.score) {
               highestSynergy = { p1, p2, score: synergyScore };
             }
             if (synergyScore < lowestSynergy.score) {
               lowestSynergy = { p1, p2, score: synergyScore };
             }
          }
        } else {
          matrix[p1.id][p2.id] = null;
        }
      });
    });


    // 5. Director Stats
    const directorStats: Record<string, { total: number, count: number }> = {};
    data.movies.forEach(m => {
        if(m.director) {
            if(!directorStats[m.director]) directorStats[m.director] = { total: 0, count: 0 };
            directorStats[m.director].total += getMovieAvg(m);
            directorStats[m.director].count++;
        }
    });
    
    const directors = Object.entries(directorStats)
        .filter(([, stat]) => stat.count >= 1) // Show all, maybe filter later if too many
        .map(([name, stat]) => ({ name, avg: stat.total / stat.count, count: stat.count }))
        .sort((a, b) => b.avg - a.avg)
        .slice(0, 5);


    // 6. Decade Stats
    const decadeStats: Record<string, number> = {};
    data.movies.forEach(m => {
        if(m.releaseYear) {
            const decade = m.releaseYear.substring(0, 3) + '0s';
            decadeStats[decade] = (decadeStats[decade] || 0) + 1;
        }
    });
    const decades = Object.entries(decadeStats)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name));
    
    // 7. Venue Stats
    const venueStats: Record<string, number> = {};
    data.movies.forEach(m => {
        const VP = m.venue || "Unknown";
        venueStats[VP] = (venueStats[VP] || 0) + 1;
    });
    const venues = Object.entries(venueStats).map(([name, value]) => ({ name, value }));
    // Sort slightly so bigger slices are better placed
    venues.sort((a, b) => b.value - a.value);

    return { leaderboard, harshest, mostFrequent, bestPicker, bestPickerAvg, streakList, matrix, highestSynergy, lowestSynergy, directors, decades, venues };
  }, [data]);


  // Genre distribution
  const genreCounts: Record<string, number> = {};
  data.movies.forEach(m => {
    m.genres?.forEach(g => {
      genreCounts[g] = (genreCounts[g] || 0) + 1;
    });
  });
  const genreData = Object.entries(genreCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-tbhc-bgQl border border-tbhc-gold/50 p-3 rounded shadow-lg bg-black">
          <p className="text-tbhc-gold font-serif mb-1">{label || payload[0].name}</p>
          <p className="text-tbhc-cream text-sm">Value: {payload[0].value.toFixed ? payload[0].value.toFixed(2) : payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  const chartHeight = Math.max(256, stats.leaderboard.length * 50);
  const COLORS = ['#cba163', '#b95c34', '#8c7b75', '#d97706', '#5d4037', '#5b21b6'];

  return (
    <div className="p-6 md:p-12 w-full max-w-6xl mx-auto animate-fade-in pb-24">
       <div className="flex justify-between items-end mb-12">
         <div>
            <h2 className="font-serif text-4xl text-tbhc-cream mb-2">Data Analytics</h2>
            <p className="text-tbhc-cream/40 text-sm font-light">Patterns in the static</p>
         </div>
       </div>

       {/* AWARDS SECTION */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Best Picker */}
          <div className="bg-gradient-to-br from-tbhc-card to-black border border-tbhc-gold/30 p-6 rounded-xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <svg className="w-24 h-24 text-tbhc-gold" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
             </div>
             <div className="relative z-10">
               <h3 className="text-tbhc-gold font-serif text-lg mb-1">All-Time Best Curator</h3>
               <p className="text-xs text-tbhc-cream/40 uppercase tracking-widest mb-4">
                 Highest Avg Selection
               </p>
               {stats.bestPicker ? (
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-tbhc-gold overflow-hidden" style={{backgroundColor: stats.bestPicker.avatarColor}}>
                       {stats.bestPicker.avatarUrl && <img src={stats.bestPicker.avatarUrl} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div>
                      <p className="text-xl text-tbhc-cream font-serif">{stats.bestPicker.name}</p>
                      <p className="text-sm text-tbhc-gold">Avg: {stats.bestPickerAvg.toFixed(1)}</p>
                    </div>
                 </div>
               ) : (
                 <p className="text-tbhc-cream/30 italic text-sm">No contenders yet.</p>
               )}
             </div>
          </div>

          {/* Harshest Critic */}
          <div className="bg-tbhc-card border border-white/5 p-6 rounded-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5">
               <svg className="w-24 h-24 text-tbhc-cream" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
             </div>
             <div className="relative z-10">
               <h3 className="text-tbhc-rust font-serif text-lg mb-1">The Harshest Critic</h3>
               <p className="text-xs text-tbhc-cream/40 uppercase tracking-widest mb-4">Lowest Avg Given</p>
               {stats.harshest ? (
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full border border-tbhc-rust/50 overflow-hidden" style={{backgroundColor: stats.harshest.avatarColor}}>
                       {stats.harshest.avatarUrl && <img src={stats.harshest.avatarUrl} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div>
                      <p className="text-xl text-tbhc-cream font-serif">{stats.harshest.name}</p>
                      <p className="text-sm text-tbhc-rust">Avg: {stats.harshest.avgGiven.toFixed(2)}</p>
                    </div>
                 </div>
               ) : (
                 <p className="text-tbhc-cream/30 italic text-sm">Everyone is too nice.</p>
               )}
             </div>
          </div>

          {/* Most Attendance */}
          <div className="bg-tbhc-card border border-white/5 p-6 rounded-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5">
               <svg className="w-24 h-24 text-tbhc-taupe" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
             </div>
             <div className="relative z-10">
               <h3 className="text-tbhc-taupe font-serif text-lg mb-1">The Regular</h3>
               <p className="text-xs text-tbhc-cream/40 uppercase tracking-widest mb-4">Most Attendance</p>
               {stats.mostFrequent ? (
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full border border-tbhc-taupe/50 overflow-hidden" style={{backgroundColor: stats.mostFrequent.avatarColor}}>
                       {stats.mostFrequent.avatarUrl && <img src={stats.mostFrequent.avatarUrl} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div>
                      <p className="text-xl text-tbhc-cream font-serif">{stats.mostFrequent.name}</p>
                      <p className="text-sm text-tbhc-taupe">{stats.mostFrequent.attendanceCount} Screenings</p>
                    </div>
                 </div>
               ) : (
                 <p className="text-tbhc-cream/30 italic text-sm">Empty theater.</p>
               )}
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-12">
         
         {/* Left Col: Leaderboard & Streaks */}
         <div className="lg:col-span-2 space-y-12">
            <div className="bg-tbhc-card p-6 rounded-xl border border-white/5">
                <h3 className="text-tbhc-cream/60 uppercase tracking-widest text-xs mb-6">Generosity Index (Avg Rating Given)</h3>
                <div className="w-full" style={{ height: chartHeight }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[...stats.leaderboard].sort((a,b) => b.avgGiven - a.avgGiven)} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                    <XAxis type="number" domain={[0, 5]} stroke="#ffffff40" tick={{fill: '#ffffff40'}} />
                    <YAxis dataKey="name" type="category" stroke="#ffffff40" tick={{fill: '#cba163', fontFamily: 'Playfair Display'}} width={80} interval={0} />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: '#ffffff05'}} />
                    <Bar dataKey="avgGiven" radius={[0, 4, 4, 0]}>
                        {stats.leaderboard.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#cba163' : '#8c7b75'} />
                        ))}
                    </Bar>
                    </BarChart>
                </ResponsiveContainer>
                </div>
            </div>

             {/* Table */}
            <div className="bg-tbhc-card rounded-xl border border-white/5 overflow-hidden">
                <div className="p-6 border-b border-white/5">
                    <h3 className="text-tbhc-cream/60 uppercase tracking-widest text-xs">Participant Breakdown</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                    <thead>
                        <tr className="bg-black/20">
                        <th className="p-4 text-tbhc-gold font-serif font-normal">Name</th>
                        <th className="p-4 text-tbhc-cream/60 font-mono text-xs uppercase">Attended</th>
                        <th className="p-4 text-tbhc-cream/60 font-mono text-xs uppercase">Avg Given</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.leaderboard.sort((a,b) => b.avgGiven - a.avgGiven).map((p) => (
                        <tr key={p.name} className="border-b border-white/5 hover:bg-white/5">
                            <td className="p-4 text-tbhc-cream">{p.name}</td>
                            <td className="p-4 text-tbhc-cream/70">{p.attendanceCount}</td>
                            <td className="p-4 text-tbhc-cream/70">{p.avgGiven.toFixed(2)}</td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
            </div>
         </div>

         {/* Right Col: Genre & Streaks */}
         <div className="space-y-8">
            
            {/* Streaks */}
            <div className="bg-tbhc-card p-6 rounded-xl border border-white/5">
                <div className="flex items-center gap-2 mb-6">
                    <svg className="w-5 h-5 text-tbhc-accent" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.45-.398-2.254 0-.35-.364-.552-.698-.403C4.931 7.17 3.864 8.56 3.342 10.18c-.523 1.619-.554 3.375.395 5.077a7.034 7.034 0 004.646 3.998c.527.117.865-.467.623-.916a.895.895 0 01.114-1.026 6.653 6.653 0 011.618-1.504c1.04-.712 2.185-.587 2.936.552.142.216.425.18.475-.067a5.008 5.008 0 00.133-2.375c-.122-1.14-.633-2.148-1.35-2.936a1 1 0 00-.16-.136c-.476-.328-.34-.779.04-1.105.223-.19.506-.34.796-.478.745-.354 1.59-.522 2.252-1.27.725-.818.857-1.93.677-2.995-.13-1.048-.7-2.029-1.478-2.57z" clipRule="evenodd" /></svg>
                    <h3 className="text-tbhc-cream/60 uppercase tracking-widest text-xs">Hot Streaks</h3>
                </div>
                <div className="space-y-4">
                    {stats.streakList.length > 0 ? (
                        stats.streakList.map((s, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden">
                                         {s.participant?.avatarUrl && <img src={s.participant.avatarUrl} className="w-full h-full object-cover" />}
                                    </div>
                                    <span className="text-tbhc-cream font-serif">{s.participant?.name}</span>
                                </div>
                                <div className="flex items-center gap-1 text-tbhc-gold">
                                    <span className="text-xl font-bold">{s.count}</span>
                                    <span className="text-xs opacity-60 uppercase">Picks &gt; 3.5</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-tbhc-cream/30 italic">No active streaks.</p>
                    )}
                </div>
            </div>

            {/* Genre Chart */}
            <div className="bg-tbhc-card p-6 rounded-xl border border-white/5">
                <h3 className="text-tbhc-cream/60 uppercase tracking-widest text-xs mb-6">Genre Frequency</h3>
                <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={genreData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="name" stroke="#ffffff40" tick={{fill: '#ffffff40', fontSize: 10}} interval={0} />
                    <YAxis stroke="#ffffff40" tick={{fill: '#ffffff40'}} />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: '#ffffff05'}} />
                    <Bar dataKey="count" fill="#b95c34" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
                </div>
            </div>

            {/* NEW: Venue Distribution */}
            <div className="bg-tbhc-card p-6 rounded-xl border border-white/5">
                <h3 className="text-tbhc-cream/60 uppercase tracking-widest text-xs mb-6">Location Tracking</h3>
                <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={stats.venues}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={60}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {stats.venues.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconSize={8} wrapperStyle={{ fontSize: '10px', opacity: 0.6 }} />
                    </PieChart>
                </ResponsiveContainer>
                </div>
            </div>
         </div>
       </div>

       {/* DIRECTOR & DECADE ANALYTICS */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Director's Cut */}
            <div className="bg-tbhc-card p-6 rounded-xl border border-white/5">
                <h3 className="text-tbhc-cream/60 uppercase tracking-widest text-xs mb-6">Director's Cut (Top Avg)</h3>
                <div className="space-y-4">
                    {stats.directors.map((d, i) => (
                         <div key={i} className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0">
                            <span className="text-tbhc-cream font-serif">{d.name} <span className="text-xs text-tbhc-cream/30 font-sans ml-2">({d.count} watched)</span></span>
                            <span className="text-tbhc-gold font-mono">{d.avg.toFixed(1)}</span>
                         </div>
                    ))}
                    {stats.directors.length === 0 && <p className="text-sm text-tbhc-cream/30 italic">No data available.</p>}
                </div>
            </div>

            {/* Decade Drift */}
            <div className="bg-tbhc-card p-6 rounded-xl border border-white/5">
                <h3 className="text-tbhc-cream/60 uppercase tracking-widest text-xs mb-6">Temporal Drift (Decades)</h3>
                <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.decades}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                            <XAxis dataKey="name" stroke="#ffffff40" tick={{fill: '#ffffff40', fontSize: 10}} />
                            <YAxis stroke="#ffffff40" tick={{fill: '#ffffff40'}} />
                            <Tooltip content={<CustomTooltip />} cursor={{fill: '#ffffff05'}} />
                            <Bar dataKey="count" fill="#8c7b75" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
       </div>

       {/* SYNERGY INDEX */}
       <div className="space-y-8">
          <div className="flex items-end justify-between">
             <div>
                <h2 className="font-serif text-3xl text-tbhc-cream mb-1">Attendee Synergy Index</h2>
                <p className="text-tbhc-cream/40 text-sm font-light">Correlation & Conflict Heatmap</p>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Highest Synergy */}
              <div className="bg-gradient-to-r from-tbhc-gold/10 to-transparent border-l-4 border-tbhc-gold p-6 rounded-r-lg flex items-center justify-between">
                  <div>
                      <h4 className="text-tbhc-gold font-serif text-xl mb-1">Mind Meld</h4>
                      <p className="text-xs text-tbhc-cream/50 uppercase tracking-widest">Highest Agreement</p>
                  </div>
                  {stats.highestSynergy.p1 ? (
                     <div className="text-right">
                         <div className="text-3xl font-mono text-white mb-1">{stats.highestSynergy.score.toFixed(0)}%</div>
                         <div className="text-xs text-tbhc-cream/70">{stats.highestSynergy.p1?.name} & {stats.highestSynergy.p2?.name}</div>
                     </div>
                  ) : <span className="text-tbhc-cream/30 text-sm italic">Insufficient data</span>}
              </div>

              {/* Lowest Synergy */}
              <div className="bg-gradient-to-r from-tbhc-rust/10 to-transparent border-l-4 border-tbhc-rust p-6 rounded-r-lg flex items-center justify-between">
                  <div>
                      <h4 className="text-tbhc-rust font-serif text-xl mb-1">Polar Opposites</h4>
                      <p className="text-xs text-tbhc-cream/50 uppercase tracking-widest">Highest Disagreement</p>
                  </div>
                  {stats.lowestSynergy.p1 ? (
                     <div className="text-right">
                         <div className="text-3xl font-mono text-white mb-1">{stats.lowestSynergy.score.toFixed(0)}%</div>
                         <div className="text-xs text-tbhc-cream/70">{stats.lowestSynergy.p1?.name} & {stats.lowestSynergy.p2?.name}</div>
                     </div>
                  ) : <span className="text-tbhc-cream/30 text-sm italic">Insufficient data</span>}
              </div>
          </div>

          {/* Heatmap Table */}
          <div className="bg-tbhc-card rounded-xl border border-white/5 overflow-x-auto p-6">
              <table className="w-full text-center border-collapse">
                  <thead>
                      <tr>
                          <th className="p-2"></th>
                          {data.participants.map(p => (
                              <th key={p.id} className="p-2 text-xs uppercase tracking-widest text-tbhc-cream/50 font-normal border-b border-white/5">
                                  {p.name.slice(0, 3)}
                              </th>
                          ))}
                      </tr>
                  </thead>
                  <tbody>
                      {data.participants.map(rowP => (
                          <tr key={rowP.id}>
                              <th className="p-2 text-left text-xs uppercase tracking-widest text-tbhc-cream/50 font-normal border-r border-white/5">
                                  {rowP.name}
                              </th>
                              {data.participants.map(colP => {
                                  const score = stats.matrix[rowP.id]?.[colP.id];
                                  let cellClass = "text-tbhc-cream/20"; // Default/Self
                                  let display = "—";

                                  if (rowP.id === colP.id) {
                                      cellClass = "bg-white/5";
                                  } else if (score !== null && score !== undefined) {
                                      display = `${score.toFixed(0)}%`;
                                      if (score >= 80) cellClass = "text-tbhc-gold font-bold bg-tbhc-gold/5";
                                      else if (score <= 60) cellClass = "text-tbhc-rust font-bold bg-tbhc-rust/5";
                                      else cellClass = "text-tbhc-cream";
                                  }

                                  return (
                                      <td key={colP.id} className={`p-3 text-sm border border-white/5 ${cellClass}`}>
                                          {display}
                                      </td>
                                  );
                              })}
                          </tr>
                      ))}
                  </tbody>
              </table>
              <div className="mt-4 text-xs text-tbhc-cream/30 text-center italic">
                  * Synergy based on avg rating difference on shared movies. 100% = Perfect Agreement.
              </div>
          </div>
       </div>
    </div>
  );
};
