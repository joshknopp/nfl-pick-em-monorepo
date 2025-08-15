import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class UserService {
  private usersCollection = admin.firestore().collection('users');

  async getUsername(uid: string): Promise<string | null> {
    const doc = await this.usersCollection.doc(uid).get();
    if (!doc.exists) return null;
    const data = doc.data();
    return data?.username || null;
  }

  async setUsername(uid: string, username: string): Promise<void> {
    await this.usersCollection.doc(uid).set({ username }, { merge: true });
  }
}
