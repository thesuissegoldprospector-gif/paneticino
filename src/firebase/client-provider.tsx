'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, Storage } from 'firebase/storage';
import { Loader2 } from 'lucide-react';

const firebaseConfig = {
  "projectId": "studio-1063796498-c439e",
  "appId": "1:531203499316:web:ce2acb291b5aa66ee23161",
  "apiKey": "AIzaSyDiUEXg8n_z2KhIwxvgBVX98g7xmuM5xCU",
  "authDomain": "studio-1063796498-c439e.firebaseapp.com",
  "storageBucket": "studio-1063796498-c439e.firebasestorage.app",
  "messagingSenderId": "531203499316",
};

// This function initializes Firebase.
function initializeFirebaseOnClient() {
  const isInitialized = getApps().length > 0;
  const app = isInitialized ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  const storage = getStorage(app);

  // NOTE: Emulator connections have been removed. 
  // The local dev environment now connects directly to production Firebase services.

  return {
    firebaseApp: app,
    auth,
    firestore,
    storage,
  };
}


interface FirebaseClientProviderProps {
  children: ReactNode;
}

interface FirebaseServices {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  storage: Storage;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [firebaseServices, setFirebaseServices] = useState<FirebaseServices | null>(null);

  useEffect(() => {
    // This effect runs only on the client, after the component has mounted.
    if (typeof window !== 'undefined') {
      const services = initializeFirebaseOnClient();
      setFirebaseServices(services);
    }
  }, []);

  // Render a loading state until Firebase is initialized on the client.
  if (!firebaseServices) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
      storage={firebaseServices.storage}
    >
      {children}
    </FirebaseProvider>
  );
}
