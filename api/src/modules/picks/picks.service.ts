import { Injectable } from '@nestjs/common';
import { PickDTO, serializeGame } from 'libs';
import * as admin from 'firebase-admin';

interface User {
  id: string;
  // add other user properties as needed
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
    const pick = {
      ...picksDto,
      user: user.id,
    };
    await admin
      .firestore()
      .collection('picks')
      .doc(this.getPickKey(user, picksDto))
      .set(pick);
    return pick;
  }

  private getPickKey(user: User, pick: PickDTO): string {
    return `${user.id}-${serializeGame(pick)}`;
  }
}
