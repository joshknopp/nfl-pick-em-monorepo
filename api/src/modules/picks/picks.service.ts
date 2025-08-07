import { Injectable, BadRequestException } from '@nestjs/common';
import * as admin from 'firebase-admin';

interface User {
  id: string;
  // add other user properties as needed
}

interface SerializableGame {
  season: number;
  week: number;
  awayTeam: string;
  homeTeam: string;
}

interface PickDTO extends SerializableGame {
  pickWinner: string;
  user?: string;
}

// Represents the structure of a game document in Firestore
interface GameDoc {
  kickoffTime: admin.firestore.Timestamp;
  // ... other game properties
}

@Injectable()
export class PicksService {
  async getUserPicks(user: User): Promise<PickDTO[]> {
    if (!user || !user.id) {
      console.error('getUserPicks: user or user.id is undefined', user);
      throw new Error(
        'User ID is undefined. Check AuthGuard and request population.'
      );
    }
    const snapshot = await admin
      .firestore()
      .collection('picks')
      .where('user', '==', user.id)
      .get();
    return snapshot.docs.map((doc) => doc.data() as PickDTO);
  }

  async getLeaguePicks(): Promise<PickDTO[]> {
    const snapshot = await admin.firestore().collection('picks').get();
    return snapshot.docs.map((doc) => doc.data() as PickDTO);
  }

  async saveUserPick(user: User, picksDto: PickDTO): Promise<PickDTO> {
    // 1. Construct the game ID
    const gameId = this.serializeGame(picksDto);

    // 2. Fetch the corresponding game document
    const gameDocRef = admin.firestore().collection('games').doc(gameId);
    const gameDoc = await gameDocRef.get();

    // 3. Check if the game exists and if it has started
    if (!gameDoc.exists) {
      throw new BadRequestException('Game not found.');
    }

    const gameData = gameDoc.data() as GameDoc;

    // The `kickoffTime` must be a Firestore Timestamp object.
    // We convert it to a JavaScript Date object for easy comparison.
    if (gameData.kickoffTime.toDate() < new Date()) {
      throw new BadRequestException('The game has already started. You cannot submit or update a pick.');
    }

    // 4. If the game has not started, proceed to save the pick
    const pick = {
      ...picksDto,
      user: user.id,
      updated: new Date(),
    };
    await admin
      .firestore()
      .collection('picks')
      .doc(this.getPickKey(user, picksDto))
      .set(pick, { merge: true }); // Using { merge: true } for a create or update

    return pick;
  }

  private getPickKey(user: User, pick: PickDTO): string {
    return `${user.id}-${this.serializeGame(pick)}`;
  }

  private serializeGame(game: SerializableGame): string {
    const season = game.season;
    const week = String(game.week).padStart(2, '0');
    const away = game.awayTeam.toLowerCase();
    const home = game.homeTeam.toLowerCase();
    return `${season}-${week}-${away}-at-${home}`;
  }
}

