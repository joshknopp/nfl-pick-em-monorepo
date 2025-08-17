import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';

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
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid Firebase token');
    }
  }
}
