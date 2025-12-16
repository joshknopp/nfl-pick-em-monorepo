import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.email) {
      return false;
    }

    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    return adminEmails.includes(user.email);
  }
}
