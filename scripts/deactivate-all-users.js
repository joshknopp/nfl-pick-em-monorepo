// Node.js script to set all user records in the Firestore 'users' collection to inactive (isActive: false)

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    const serviceAccount = require('../api/serviceAccountKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (e) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
}

const db = admin.firestore();

async function deactivateAllUsers() {
  console.log('Deactivating all users in Firestore...');
  const usersCollection = db.collection('users');
  const snapshot = await usersCollection.get();

  if (snapshot.empty) {
    console.log('No user documents found in Firestore.');
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.set(doc.ref, { isActive: false }, { merge: true });
  });

  await batch.commit();
  console.log(`Successfully deactivated ${snapshot.size} user document(s).`);
}

deactivateAllUsers().catch((err) => {
  console.error('Error deactivating users:', err);
  process.exit(1);
});
