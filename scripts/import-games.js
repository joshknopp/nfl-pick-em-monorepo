// A simple Node.js script to import CSV data from a file into a Firestore collection.

// --- 1. Import Dependencies ---
const admin = require('firebase-admin');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

// --- 2. Firebase Admin SDK Setup ---
// IMPORTANT: You must download your Firebase service account key JSON file
// from the Firebase console (Project settings > Service accounts) and
// place it in the same directory as this script.
const serviceAccount = require('../api/serviceAccountKey.json');

// Initialize the Firebase app with the service account credentials.
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const collectionName = 'games';
const gamesCollection = db.collection(collectionName);

// --- 3. File Path for the CSV Data ---
// Ensure that 'csv is in the same directory as this script.
const csvFilePath = path.join(__dirname, '2025-regular-season.csv');

// --- 4. Main Import Logic ---
async function importGames() {
  console.log(`Starting import to collection: "${collectionName}"...`);
  const games = [];

  // Create a read stream from the CSV file and pipe it to the csv-parser
  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on('data', (data) => games.push(data))
    .on('end', async () => {
      if (games.length === 0) {
        console.log(
          'No data to import. Please check if the file is correct and not empty.'
        );
        return;
      }

      const batch = db.batch();
      console.log(`Parsed ${games.length} game records.`);

      let importCount = 0;
      games.forEach((game) => {
        // Skip games that don't have season, week, away, or home defined
        if (!game.season || !game.week || !game.away || !game.home) {
          console.error(
            `Skipping record due to missing required field(s): ${JSON.stringify(
              game
            )}`
          );
          return;
        }

        try {
          // Construct a unique document ID with separate variables
          const season = game.season;
          const week = String(game.week).padStart(2, '0');
          const away = game.away.toLowerCase().replace(/ /g, '');
          const home = game.home.toLowerCase().replace(/ /g, '');
          const gameId = `${season}-${week}-${away}-at-${home}`;

          // Create a Firestore Timestamp object from the dateTimeISO field
          const kickoffTime = new Date(game.dateTimeISO);

          // Create the document data, ,omitting the 'status' field.
          const gameData = {
            season: parseInt(game.season, 10),
            week: parseInt(game.week, 10),
            awayTeam: game.away,
            homeTeam: game.home,
            kickoffTime: kickoffTime,
            winner: game.winner || null, // Store the winner if it exists, otherwise store null
          };

          // Add the document to the batch
          const docRef = gamesCollection.doc(gameId);
          batch.set(docRef, gameData);
          importCount++;
        } catch (error) {
          console.error(`Error processing row: ${JSON.stringify(game)}`, error);
        }
      });

      try {
        await batch.commit();
        console.log(
          `Successfully imported ${importCount} documents into Firestore.`
        );
      } catch (error) {
        console.error('Error committing batch:', error);
      }
    });
}

// Run the function
importGames();
