import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

// This function initializes and returns a Firebase app instance.
// It ensures that Firebase is initialized only once.
function initializeFirebaseApp(): FirebaseApp {
    if (!getApps().length) {
        // If no apps are initialized, initialize a new one.
        return initializeApp(firebaseConfig);
    } else {
        // If an app is already initialized, return the existing one.
        return getApp();
    }
}

const app = initializeFirebaseApp();
const firestore = getFirestore(app);

export { firestore };
