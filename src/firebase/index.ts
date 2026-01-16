'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, updateProfile } from 'firebase/auth';
import { getFirestore, DocumentReference } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { User } from 'firebase/auth';
import { updateDocumentNonBlocking } from './non-blocking-updates';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  let firebaseApp;
  if (!getApps().length) {
    // App Hosting provides the config via environment variables,
    // so we can call initializeApp() without arguments.
    firebaseApp = initializeApp();
  } else {
    firebaseApp = getApp();
  }

  // Ensure storage is initialized.
  const storage = getStorage(firebaseApp);

  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
    storage: storage
  };
}

export async function updateUserProfileAndAuth(user: User, userDocRef: DocumentReference, data: any) {
  if (!user || !userDocRef) return;
  const authUpdates: any = {};
  const firestoreUpdates: any = {};

  if (data.firstName && data.lastName) {
    const displayName = `${data.firstName} ${data.lastName}`;
    if (user.displayName !== displayName) authUpdates.displayName = displayName;
    firestoreUpdates.firstName = data.firstName;
    firestoreUpdates.lastName = data.lastName;
  }

  if (data.photoURL && user.photoURL !== data.photoURL) {
    authUpdates.photoURL = data.photoURL;
    firestoreUpdates.photoURL = data.photoURL;
  }

  if (Object.keys(authUpdates).length > 0) await updateProfile(user, authUpdates);
  if (Object.keys(firestoreUpdates).length > 0) updateDocumentNonBlocking(userDocRef, firestoreUpdates);
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
