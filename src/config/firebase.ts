import admin from 'firebase-admin';

let firebaseAdminInitialized = false;

export function initFirebaseAdmin(): typeof admin | null {
  if (firebaseAdminInitialized) return admin;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    try {
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
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
      if (!admin.apps.length) {
        admin.initializeApp({
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
