import { GoogleGenAI } from "@google/genai";

// Get TMDB API key from environment variable instead of hardcoding
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

export const fetchMovieMetadata = async (query: string, year?: string, directorHint?: string): Promise<Partial<any>> => {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  
  if (!TMDB_API_KEY) {
    console.error("TMDB API key is missing");
    return { title: query, releaseYear: year, director: directorHint };
  }
  
  try {
    let candidates: any[] = [];
    
    // 1. SEARCH TMDB
    const searchBase = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
    
    // Strategy A: Try specific year first (if provided)
    if (year) {
      try {
        const yearRes = await fetch(`${searchBase}&year=${encodeURIComponent(year)}`);
        const yearData = await yearRes.json();
        if (yearData.results?.length > 0) {
          candidates = yearData.results;
        }
      } catch (e) {
        console.warn("TMDB Year search failed", e);
      }
    }
    
    // Strategy B: Fallback to broad search if no candidates found yet (or year wasn't provided)
    if (candidates.length === 0) {
       const broadRes = await fetch(searchBase);
       const broadData = await broadRes.json();
       candidates = broadData.results || [];
    }

    if (candidates.length === 0) {
      console.warn("No movie found on TMDB for:", query);
      return { title: query, releaseYear: year, director: directorHint };
    }

    // 2. SELECT BEST CANDIDATE
    // Sort by popularity initially to ensure high quality defaults
    candidates.sort((a: any, b: any) => b.popularity - a.popularity);

    let selectedMovieId = candidates[0].id;

    // If Director Hint is provided, we check the top 5 candidates for a match.
    if (directorHint && directorHint.trim().length > 2) {
        const topCandidates = candidates.slice(0, 5);
        const hintLower = directorHint.toLowerCase();

        // We need to fetch credits to verify director (Search API doesn't provide it)
        const checks = await Promise.all(topCandidates.map(async (movie) => {
            try {
                const credsRes = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}/credits?api_key=${TMDB_API_KEY}`);
                const creds = await credsRes.json();
                const dirName = creds.crew?.find((p: any) => p.job === 'Director')?.name;
                return { 
                    id: movie.id, 
                    director: dirName,
                    match: dirName && dirName.toLowerCase().includes(hintLower)
                };
            } catch (e) {
                return { id: movie.id, director: null, match: false };
            }
        }));

        const bestMatch = checks.find(c => c.match);
        if (bestMatch) {
            selectedMovieId = bestMatch.id;
        }
    }

    // 3. GET FULL DETAILS
    const detailsUrl = `https://api.themoviedb.org/3/movie/${selectedMovieId}?api_key=${TMDB_API_KEY}&append_to_response=credits`;
    const detailsRes = await fetch(detailsUrl);
    const detailsData = await detailsRes.json();

    const finalDirector = detailsData.credits?.crew?.find((p: any) => p.job === 'Director')?.name || directorHint;
    
    // Calculate Fallback Official Rating from TMDB (0-10 -> 0-5 scale)
    const tmdbScore = detailsData.vote_average ? (detailsData.vote_average / 2).toFixed(1) : null;
    let officialRating = tmdbScore ? `${tmdbScore}/5` : undefined;

    const metadata: any = {
      title: detailsData.title,
      synopsis: detailsData.overview,
      runtime: detailsData.runtime, // integer minutes
      director: finalDirector,
      releaseYear: detailsData.release_date ? detailsData.release_date.split('-')[0] : '',
      genres: detailsData.genres?.map((g: any) => g.name).slice(0, 3),
      posterUrl: detailsData.poster_path 
        ? `https://image.tmdb.org/t/p/w500${detailsData.poster_path}` 
        : undefined,
      officialRating: officialRating,
      quote: undefined // Filled by Gemini below
    };

    // 4. GEMINI AUGMENTATION (Real IMDb Web Search & Quote)
    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });
      
      // ATTEMPT 1: Live Web Search (The "Scraper" Approach)
      try {
        const prompt = `
          Search for the movie "${metadata.title}" (${metadata.releaseYear}) on IMDb.
          1. Find the current numeric IMDb rating (out of 10).
          2. Find a memorable, iconic quote from the movie.
          
          Output ONLY raw text in this exact format:
          IMDB: [number]
          QUOTE: [quote string]
        `;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
          }
        });

        const text = response.text || "";
        
        // Parse IMDb Rating
        const ratingMatch = text.match(/IMDB:\s*(\d+(?:\.\d+)?)/i);
        if (ratingMatch && ratingMatch[1]) {
            const rawImdb = parseFloat(ratingMatch[1]);
            // Convert 0-10 scale to 0-5 scale to match app aesthetics
            const scaled = (rawImdb / 2).toFixed(1);
            metadata.officialRating = `${scaled}/5`;
        }

        // Parse Quote
        const quoteMatch = text.match(/QUOTE:\s*(.+)/i) || text.match(/"([^"]+)"/);
        if (quoteMatch && quoteMatch[1]) {
            metadata.quote = quoteMatch[1].replace(/^"|"$/g, '').trim();
        }

      } catch (toolError) {
        console.warn("Gemini Web Search failed, falling back to internal knowledge:", toolError);
        
        // ATTEMPT 2: Fallback (Internal Knowledge Only)
        try {
             const fallbackPrompt = `Return a JSON object with a "quote" key containing a memorable quote from "${metadata.title}" (${metadata.releaseYear}).`;
             const fallbackResponse = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: fallbackPrompt,
                config: { responseMimeType: 'application/json' }
             });
             
             const jsonText = fallbackResponse.text;
             if (jsonText) {
                 const parsed = JSON.parse(jsonText);
                 if (parsed.quote) metadata.quote = parsed.quote;
             }
        } catch (fallbackError) {
            console.error("Gemini Fallback failed:", fallbackError);
        }
      }
    }

    return metadata;

  } catch (error) {
    console.error("Metadata fetch failed:", error);
    return {};
  }
};

export const generateTasteProfile = async (participantName: string, ratings: {title: string, score: number}[]) => {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  if (!apiKey) throw new Error("API Key missing");
  const ai = new GoogleGenAI({ apiKey });
  
  // Format ratings for the prompt
  const moviesText = ratings
    .sort((a, b) => b.score - a.score) // Sort by highest rated first
    .map(r => `${r.title} (${r.score}/5)`)
    .join(', ');

  const prompt = `
    Analyze the cinematic taste of "${participantName}" based on these ratings they gave: ${moviesText}.
    
    Please provide a "Psychographic Profile" in the voice of a sophisticated, slightly pretentious 1970s film critic or a high-end sci-fi computer (like HAL 9000 but friendlier).
    
    Include:
    1. A "Vibe" summary (2-3 words).
    2. A short paragraph (max 80 words) analyzing their preferences (genres, themes, eras).
    3. A "Guilty Pleasure" prediction (invent a plausible specific sub-genre they probably secretly like).
    
    Return as plain text, formatted nicely.
  `;
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });
  return response.text;
};

export const generateGroupRecommendations = async (movies: {title: string, avgScore: number, genres?: string[]}[]) => {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  if (!apiKey) throw new Error("API Key missing");
  const ai = new GoogleGenAI({ apiKey });
  
  // Filter for high rated movies to base recommendations on
  const highRated = movies
    .filter(m => m.avgScore >= 3.5)
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 15)
    .map(m => m.title);

  const prompt = `
    Act as a Cinema Curator AI. 
    A group of friends has watched and highly rated the following movies: ${highRated.join(', ')}.
    
    Recommend 3 DISTINCT movies they should watch next. 
    They should not be movies already in the list.
    
    For each recommendation provide:
    1. Title & Year
    2. A one-sentence "Pitch" explaining why it fits their specific group taste.
    
    Format the output as a JSON list of objects with keys: "title", "year", "pitch".
  `;
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  
  return JSON.parse(response.text || "[]");
};