'use server';

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import serviceAccount from '../../../config/serviceAccountKey.json';

// Inizializza Firebase Admin solo una volta, leggendo le credenziali dal file.
// Questo risolve l'errore "client_email" mancante.
if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
    storageBucket: 'studio-1063796498-c439e.firebasestorage.app'
  });
}

/**
 * Riceve un'immagine come stringa base64, la carica su Firebase Storage e restituisce l'URL pubblico.
 * @param base64 - La stringa base64 dell'immagine (formato data URL).
 * @param fileName - Il percorso/nome del file su Firebase Storage.
 * @param contentType - Il tipo MIME del file (es. 'image/jpeg').
 * @returns L'URL pubblico del file caricato.
 */
export async function uploadImageBase64(base64: string, fileName: string, contentType: string): Promise<string> {
  // Specifica esplicitamente il nome del bucket per evitare ambiguità.
  const bucketName = 'studio-1063796498-c439e.firebasestorage.app';
  const bucket = getStorage().bucket(bucketName);
  
  // Rimuove l'intestazione dal data URL per ottenere solo i dati base64.
  const base64Data = base64.split(';base64,').pop();
  if (!base64Data) {
    throw new Error('Formato stringa base64 non valido.');
  }

  // Converte la stringa base64 in un buffer.
  const fileBuffer = Buffer.from(base64Data, 'base64');
  const file = bucket.file(fileName);

  // Salva il buffer nello storage.
  await file.save(fileBuffer, {
    metadata: {
      contentType: contentType,
    },
    public: true, // Rende il file immediatamente pubblico e leggibile.
  });
  
  // Costruisce e restituisce l'URL pubblico.
  return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
}
