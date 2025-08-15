
import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class UsersService {
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

	async ensureUsernameOnLogin(user: { uid: string; email: string; displayName?: string }): Promise<string> {
		const doc = await this.usersCollection.doc(user.uid).get();
		let username = doc.exists ? doc.data()?.username : undefined;
		if (!username) {
			username = user.displayName || user.email.split('@')[0];
			await this.usersCollection.doc(user.uid).set({ username }, { merge: true });
		}
		return username;
	}
}
