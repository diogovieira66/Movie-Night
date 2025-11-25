
export interface Rating {
  userId: string;
  score: number; // 1-10
  comment?: string;
}

export interface Movie {
  id: string;
  title: string;
  dateWatched: string;
  selectorId: string;
  posterUrl?: string;
  synopsis?: string;
  runtime?: number; // in minutes
  director?: string;
  releaseYear?: string;
  genres?: string[];
  ratings: Rating[]; // Array of individual ratings
  officialRating?: string; // e.g., "8.5/10 IMDb"
  quote?: string; // A memorable line of dialogue
  venue?: string; // e.g. "Alamo Drafthouse", "Home"
}

export interface Participant {
  id: string;
  name: string;
  avatarColor: string;
  avatarUrl?: string; // Base64 string of the uploaded image
}

export interface AppData {
  movies: Movie[];
  participants: Participant[];
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  LOG = 'LOG',
  STATS = 'STATS',
  SETTINGS = 'SETTINGS',
  ORACLE = 'ORACLE',
}

export interface GeminiConfig {
  apiKey: string;
}
