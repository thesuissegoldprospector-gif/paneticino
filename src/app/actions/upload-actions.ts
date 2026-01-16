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

  // This is the correct way to get the default bucket name from App Hosting env vars.
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
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
    
    // Make the file public and get the URL
    await blob.makePublic();
    const publicUrl = blob.publicUrl();
    
    return { url: publicUrl };

  } catch (e: any) {
    console.error('Errore di caricamento lato server:', e);
    return { error: `Errore di caricamento: ${e.message}` };
  }
}
