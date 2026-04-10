import { getApp, getApps, initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: 'AIzaSyDt-Jjw0jZ-GbZYB4UNpy0oSaYNOLOFwI0',
  authDomain: 'daily-journal-app-a8a4a.firebaseapp.com',
  projectId: 'daily-journal-app-a8a4a',
  storageBucket: 'daily-journal-app-a8a4a.firebasestorage.app',
  messagingSenderId: '838768500718',
  appId: '1:838768500718:web:a85707fa9097d924f578ff',
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const storage = getStorage(app);
