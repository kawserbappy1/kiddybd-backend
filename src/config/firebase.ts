import * as admin from 'firebase-admin';

let firebaseAdminInitialized = false;

export function initFirebaseAdmin(): any {
  if (firebaseAdminInitialized) return admin;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const firebaseApp = admin as any;

  if (projectId && clientEmail && privateKey) {
    try {
      if (!firebaseApp.apps?.length) {
        firebaseApp.initializeApp({
          credential: firebaseApp.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
      }
      firebaseAdminInitialized = true;
      console.log('✅ Firebase Admin SDK initialized successfully');
      return admin;
    } catch (err: any) {
      console.error('❌ Failed to initialize Firebase Admin SDK:', err.message);
    }
  } else {
    // If not full service account, try default if available
    try {
      if (!firebaseApp.apps?.length) {
        firebaseApp.initializeApp({
          projectId: projectId || 'kiddybd',
        });
      }
      firebaseAdminInitialized = true;
      return admin;
    } catch {
      // Ignored if unconfigured
    }
  }

  return null;
}
