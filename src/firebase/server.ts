import { initializeApp, getApps, getApp, FirebaseApp, FirebaseOptions } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// This function initializes and returns a Firebase app instance.
// It ensures that Firebase is initialized only once.
function initializeFirebaseApp(): FirebaseApp {
    if (getApps().length > 0) {
        return getApp();
    }

    // When deployed to App Hosting, FIREBASE_CONFIG is set as an environment variable.
    // We need to parse it to get the config object for server-side rendering.
    const firebaseConfigEnv = process.env.FIREBASE_CONFIG;
    if (firebaseConfigEnv) {
        try {
            const config: FirebaseOptions = JSON.parse(firebaseConfigEnv);
            return initializeApp(config);
        } catch (e) {
             console.error("Failed to parse FIREBASE_CONFIG. Server-side Firebase initialization failed.", e);
        }
    }
    
    // The original code had this fallback. The error "Need to provide options"
    // is thrown when this is called in an environment where config isn't auto-injected.
    // The logic above should handle the App Hosting case correctly.
    return initializeApp();
}

const app = initializeFirebaseApp();
const firestore = getFirestore(app);

export { firestore };
