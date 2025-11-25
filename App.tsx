import React, { useState, useEffect } from 'react';
import { AppData, ViewState, Movie, Participant } from './types';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { MovieLog } from './components/MovieLog';
import { Stats } from './components/Stats';
import { Settings } from './components/Settings';
import { Oracle } from './components/Oracle';
import { AddMovieModal } from './components/AddMovieModal';
import { saveDataToFirestore, loadDataFromFirestore } from './services/firestoreService';

const DEFAULT_PARTICIPANTS: Participant[] = [
  { id: '1', name: 'Alex', avatarColor: '#b95c34' },
  { id: '2', name: 'Jamie', avatarColor: '#cba163' },
  { id: '3', name: 'Nick', avatarColor: '#8c7b75' },
  { id: '4', name: 'Matt', avatarColor: '#d97706' },
];

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('star_treatment_theme') as 'dark' | 'light') || 'dark';
  });

  const toggleTheme = () => {
    setTheme(prev => {
        const newTheme = prev === 'dark' ? 'light' : 'dark';
        localStorage.setItem('star_treatment_theme', newTheme);
        return newTheme;
    });
  };

  useEffect(() => {
    if (theme === 'light') {
        document.body.classList.add('theme-light');
    } else {
        document.body.classList.remove('theme-light');
    }
  }, [theme]);
  
  const [data, setData] = useState<AppData>({ 
    movies: [], 
    participants: DEFAULT_PARTICIPANTS 
  });

  // Load data from Firestore on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const firestoreData = await loadDataFromFirestore();
        if (firestoreData) {
          setData(firestoreData);
        } else {
          // Fallback to localStorage if Firestore is empty
          const saved = localStorage.getItem('star_treatment_data');
          if (saved) {
            const localData = JSON.parse(saved);
            setData(localData);
            // Migrate to Firestore
            await saveDataToFirestore(localData);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to localStorage
        const saved = localStorage.getItem('star_treatment_data');
        if (saved) {
          setData(JSON.parse(saved));
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Save to Firestore whenever data changes
  useEffect(() => {
    if (!isLoading && data.movies.length > 0) {
      saveDataToFirestore(data).catch(err => {
        console.error('Failed to save to Firestore:', err);
      });
      // Also keep localStorage as backup
      localStorage.setItem('star_treatment_data', JSON.stringify(data));
    }
  }, [data, isLoading]);

  const handleSaveMovie = (movie: Movie) => {
    if (editingMovie) {
        setData(prev => ({
            ...prev,
            movies: prev.movies.map(m => m.id === movie.id ? movie : m)
        }));
        setIsModalOpen(false);
        setEditingMovie(null);
    } else {
        setData(prev => ({
            ...prev,
            movies: [...prev.movies, movie]
        }));
        
        setIsModalOpen(false);
        setEditingMovie(null);
        setView(ViewState.LOG);
    }
  };

  const handleDeleteMovie = (movieId: string) => {
    if (window.confirm("Are you sure you want to permanently delete this log entry?")) {
        setData(prev => ({
            ...prev,
            movies: prev.movies.filter(m => m.id !== movieId)
        }));
        setIsModalOpen(false);
        setEditingMovie(null);
    }
  };

  const handleEditMovie = (movie: Movie) => {
      setEditingMovie(movie);
      setIsModalOpen(true);
  };

  const handleCloseModal = () => {
      setIsModalOpen(false);
      setEditingMovie(null);
  };

  const handleUpdateData = (newData: AppData) => {
    setData(newData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-tbhc-bg">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-tbhc-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-tbhc-cream font-mono">Loading cinema archives...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-tbhc-bg text-tbhc-cream selection:bg-tbhc-gold selection:text-tbhc-bg transition-colors duration-300">
      <Navigation currentView={view} setView={setView} toggleTheme={toggleTheme} currentTheme={theme} />
      
      <main className="flex-1 h-auto md:h-screen overflow-y-auto relative custom-scrollbar">
        {view === ViewState.DASHBOARD && (
          <Dashboard 
            data={data} 
            onNavigateToLog={() => setView(ViewState.LOG)} 
          />
        )}
        {view === ViewState.LOG && <MovieLog data={data} onEditMovie={handleEditMovie} onDeleteMovie={handleDeleteMovie} />}
        {view === ViewState.STATS && <Stats data={data} />}
        {view === ViewState.ORACLE && <Oracle data={data} />}
        {view === ViewState.SETTINGS && <Settings data={data} onUpdateData={handleUpdateData} />}
        
        <button
          onClick={() => { setEditingMovie(null); setIsModalOpen(true); }}
          className="fixed bottom-8 right-8 bg-tbhc-gold text-tbhc-bg w-14 h-14 rounded-full shadow-lg hover:bg-white hover:scale-105 transition-all flex items-center justify-center z-40 group"
          title="Add Movie"
        >
          <svg className="w-6 h-6 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </button>
      </main>

      <AddMovieModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSave={handleSaveMovie}
        onDelete={handleDeleteMovie}
        data={data}
        initialMovie={editingMovie}
      />
    </div>
  );
};

export default App;

