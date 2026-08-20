import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class UserService {
  private usersCollection = admin.firestore().collection('users');

  async activateUser(uid: string): Promise<void> {
    await this.usersCollection.doc(uid).set({ isActive: true }, { merge: true });
  }

  async getUsername(uid: string): Promise<string | null> {
    const docRef = this.usersCollection.doc(uid);
    const doc = await docRef.get();
    let data = doc.data();
    if (!doc.exists || data?.isActive !== true) {
      await docRef.set({ isActive: true }, { merge: true });
      const updatedDoc = await docRef.get();
      data = updatedDoc.data();
    }
    return data?.username || null;
  }

  async setUsername(uid: string, username: string): Promise<void> {
    await this.usersCollection.doc(uid).set({ username, isActive: true }, { merge: true });
  }

  async deactivateAllUsers(): Promise<{ deactivatedCount: number }> {
    const snapshot = await this.usersCollection.get();
    if (snapshot.empty) return { deactivatedCount: 0 };

    const batch = admin.firestore().batch();
    snapshot.docs.forEach((doc) => {
      batch.set(doc.ref, { isActive: false }, { merge: true });
    });
    await batch.commit();

    return { deactivatedCount: snapshot.size };
  }
}
