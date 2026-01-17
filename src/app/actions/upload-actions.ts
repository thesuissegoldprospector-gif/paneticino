'use server';

import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { randomUUID } from 'crypto';

// Initialize Firebase Admin SDK
// App Hosting injects configuration via environment variables.
// We must check if the app is already initialized.
if (getApps().length === 0) {
  initializeApp();
}

export async function uploadImage(formData: FormData): Promise<{ url?: string; error?: string }> {
  const file = formData.get('file') as File | null;
  const pathPrefix = formData.get('pathPrefix') as string | null; // e.g. 'avatars/userId' or 'images/userId'

  if (!file) {
    return { error: 'Nessun file fornito.' };
  }
  if (!pathPrefix) {
      return { error: 'Percorso di caricamento non specificato.' };
  }

  // The environment variable FIREBASE_STORAGE_BUCKET is not reliably available in this environment.
  // We will use the bucket name from the known Firebase configuration.
  const bucketName = 'studio-1063796498-c439e.firebasestorage.app';
  if (!bucketName) {
      return { error: 'Impossibile determinare il bucket di storage. Assicurati che FIREBASE_STORAGE_BUCKET sia configurato.' };
  }

  try {
    const bucket = getStorage().bucket(bucketName);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${pathPrefix}/${randomUUID()}.${fileExtension}`;
    
    const buffer = Buffer.from(await file.arrayBuffer());

    const blob = bucket.file(fileName);
    await blob.save(buffer, {
        metadata: {
            contentType: file.type,
        },
    });
    
    // Make the file public and get the URL using the recommended method
    await blob.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
    
    return { url: publicUrl };

  } catch (e: any) {
    console.error('Errore di caricamento lato server:', e);
    return { error: `Errore di caricamento: ${e.message}` };
  }
}
