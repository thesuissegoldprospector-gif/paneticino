'use client';
    
import {
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  CollectionReference,
  DocumentReference,
  SetOptions,
} from 'firebase/firestore';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Initiates a setDoc operation for a document reference.
 * The returned promise will reject if the write fails.
 */
export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options: SetOptions) {
  const promise = setDoc(docRef, data, options).catch(error => {
    if (error.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'write',
          requestResourceData: data,
        });
        throw permissionError;
    }
    throw error;
  });
  return promise;
}


/**
 * Initiates an addDoc operation for a collection reference.
 * The returned promise will reject if the write fails.
 */
export function addDocumentNonBlocking(colRef: CollectionReference, data: any) {
  const promise = addDoc(colRef, data)
    .catch(error => {
      if (error.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
              path: colRef.path,
              operation: 'create',
              requestResourceData: data,
          });
          throw permissionError;
      }
      throw error;
    });
  return promise;
}


/**
 * Initiates an updateDoc operation for a document reference.
 * The returned promise will reject if the write fails.
 */
export function updateDocumentNonBlocking(docRef: DocumentReference, data: any) {
  const promise = updateDoc(docRef, data)
    .catch(error => {
      if (error.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
              path: docRef.path,
              operation: 'update',
              requestResourceData: data,
          });
          throw permissionError;
      }
      throw error;
    });
  return promise;
}


/**
 * Initiates a deleteDoc operation for a document reference.
 * The returned promise will reject if the write fails.
 */
export function deleteDocumentNonBlocking(docRef: DocumentReference) {
  const promise = deleteDoc(docRef)
    .catch(error => {
      if (error.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
              path: docRef.path,
              operation: 'delete',
          });
          throw permissionError;
      }
      throw error;
    });
  return promise;
}
