import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { AppData } from '../types';

const DATA_DOC_ID = 'app-data';

export const saveDataToFirestore = async (data: AppData): Promise<void> => {
  try {
    await setDoc(doc(db, 'movieNight', DATA_DOC_ID), {
      movies: data.movies,
      participants: data.participants,
      lastUpdated: new Date().toISOString()
    });
    console.log('Data saved to Firestore');
  } catch (error) {
    console.error('Error saving to Firestore:', error);
    throw error;
  }
};

export const loadDataFromFirestore = async (): Promise<AppData | null> => {
  try {
    const docRef = doc(db, 'movieNight', DATA_DOC_ID);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        movies: data.movies || [],
        participants: data.participants || []
      };
    }
    return null;
  } catch (error) {
    console.error('Error loading from Firestore:', error);
    return null;
  }
};