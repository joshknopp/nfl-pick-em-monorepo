import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader =
      request.headers['Authorization'] || request.headers['authorization'];
    if (!authHeader) throw new UnauthorizedException('No Authorization header');
    const token = authHeader.replace('Bearer ', '');
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      request.user = { id: decodedToken.uid, ...decodedToken };

      const userRef = admin.firestore().collection('users').doc(decodedToken.uid);
      const userDoc = await userRef.get();
      if (!userDoc.exists || userDoc.data()?.isActive !== true) {
        await userRef.set({ isActive: true }, { merge: true });
      }

      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid Firebase token');
    }
  }
}
