/**
 * FIREBASE KICKOFF TIME MIGRATION SCRIPT
 *
 * GOAL: Add 1 hour to all documents where kickoffTime is >= Nov 1, 2025,
 * and the update has not been applied already.
 *
 * NOTE: This script is designed to be run in a Node.js environment using the
 * Firebase Admin SDK.
 *
 * INSTRUCTIONS:
 * 1. Install the Firebase Admin SDK: npm install firebase-admin
 * 2. Set up your service account credentials (e.g., create json file cired in SERVICE_ACCOUNT constant).
 * 3. Confirm the COLLECTION_NAME constant.
 * 4. Confirm START_DATE_STRING constant.
 * 5. Run `node dst-hour-add.js`
 */

// Import the Admin SDK
const admin = require('firebase-admin');

// --- CONFIGURATION ---

// Set the name of the collection containing the documents
const COLLECTION_NAME = 'games';
const BATCH_SIZE = 499; // Max documents per batch is 500
const SERVICE_ACCOUNT = require('./nfl-prod-service-account.json');

// Define the start date for the migration query.
// Documents with kickoffTime on or after this date will be considered.
const START_DATE_STRING = '2025-11-08T00:00:00.000Z';
const START_TIMESTAMP = admin.firestore.Timestamp.fromDate(
  new Date(START_DATE_STRING)
);

// Idempotency Field: A unique field used to mark successfully migrated documents.
// If you run this script again, documents with this field set to true will be skipped.
const IDEMPOTENCY_FIELD = 'migration_v1_subtract_hour';

// Initialize the Firebase Admin SDK
try {
  admin.initializeApp({
    credential: admin.credential.cert(SERVICE_ACCOUNT),
  });
} catch (error) {
  console.error(
    'Error initializing Firebase Admin SDK. Make sure your environment is configured (e.g., GOOGLE_APPLICATION_CREDENTIALS).',
    error
  );
  process.exit(1);
}

const db = admin.firestore();

/**
 * Executes the migration by querying for target documents and performing batched updates.
 */
async function runMigration() {
  console.log(`Starting migration for collection: ${COLLECTION_NAME}`);
  console.log(`Targeting documents with kickoffTime >= ${START_DATE_STRING}`);

  // Create a query to find documents that:
  // 1. Have kickoffTime on or after the START_TIMESTAMP.
  // 2. Do NOT have the idempotency field set yet (ensures idempotency).
  const query = db
    .collection(COLLECTION_NAME)
    .where('kickoffTime', '>=', START_TIMESTAMP)
    //.where(IDEMPOTENCY_FIELD, '==', false)
    .limit(BATCH_SIZE);

  let documentsProcessed = 0;
  let totalBatches = 0;
  let lastDocumentSnapshot = null;
  let allDone = false;

  while (!allDone) {
    let currentQuery = query;

    // If this is not the first iteration, start after the last processed document
    if (lastDocumentSnapshot) {
      currentQuery = query.startAfter(lastDocumentSnapshot);
    }

    const snapshot = await currentQuery.get();
    totalBatches++;

    if (snapshot.size === 0) {
      allDone = true;
      break;
    }

    const batch = db.batch();
    const docsInBatch = snapshot.docs.length;
    console.log(
      `\nProcessing Batch #${totalBatches} (${docsInBatch} documents)...`
    );

    for (const doc of snapshot.docs) {
      const docData = doc.data();

      // SECONDARY IDEMPOTENCY CHECK (for safety during a single run)
      // If the field exists and is already true, skip this document.
      if (docData[IDEMPOTENCY_FIELD] === true) {
        console.log(`  -> Skipping ${doc.id}: Already migrated.`);
        continue;
      }

      const originalKickoffTime = docData.kickoffTime;

      // Convert Firestore Timestamp to JavaScript Date
      const originalDate = originalKickoffTime.toDate();

      // Calculate the new kickoff time by subtracting 1 hour (3600000 milliseconds)
      const newDate = new Date(originalDate.getTime() - 60 * 60 * 1000);

      // Convert the new Date back to a Firestore Timestamp
      const newKickoffTime = admin.firestore.Timestamp.fromDate(newDate);

      // Prepare the update object
      const updateData = {
        kickoffTime: newKickoffTime,
        [IDEMPOTENCY_FIELD]: true, // Set the flag for idempotency
      };

      // Add the update to the batch
      batch.update(doc.ref, updateData);

      documentsProcessed++;
      console.log(
        `  -> Updated ${
          doc.id
        }: ${originalDate.toISOString()} -> ${newDate.toISOString()}`
      );
    }

    // Commit the batch of updates
    await batch.commit();
    console.log(`Batch #${totalBatches} committed successfully.`);

    // Set the last document to continue from in the next iteration
    lastDocumentSnapshot = snapshot.docs[snapshot.docs.length - 1];

    // If the snapshot size is less than the BATCH_SIZE, it means we've reached the end
    if (snapshot.size < BATCH_SIZE) {
      allDone = true;
    }

    // Add a small pause to respect Firestore limits
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log(`\n✅ MIGRATION COMPLETE!`);
  console.log(`Total documents processed and updated: ${documentsProcessed}`);
  console.log(`Total batches committed: ${totalBatches}`);
}

// Execute the migration function
runMigration().catch((error) => {
  console.error('\n❌ MIGRATION FAILED DUE TO AN ERROR:');
  console.error(error);
  process.exit(1);
});
