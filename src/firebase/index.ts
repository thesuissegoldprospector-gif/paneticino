'use client';

import { updateProfile } from 'firebase/auth';
import { DocumentReference } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { updateDocumentNonBlocking } from './non-blocking-updates';

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
