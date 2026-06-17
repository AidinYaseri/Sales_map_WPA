import { initializeApp } from 'firebase/app'
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore'

const app = initializeApp({
  apiKey:            'AIzaSyAhdX-_aKqXwdHHAiWqzwYcuN09oKkESg4',
  authDomain:        'aeas-a2d06.firebaseapp.com',
  projectId:         'aeas-a2d06',
  storageBucket:     'aeas-a2d06.firebasestorage.app',
  messagingSenderId: '620050893865',
  appId:             '1:620050893865:web:aa11d5d054c9c6e8b6a038',
})

// Persistent local cache enables offline support
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache(),
})
