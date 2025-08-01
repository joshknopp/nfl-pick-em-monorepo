import { Injectable, inject } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { AuthService } from './auth.service';
import { Observable, combineLatest } from 'rxjs'; // Import combineLatest
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    // Wait for Firebase Auth to be ready, then check authentication status
    return combineLatest([
      this.authService.authReady$,
      this.authService.isAuthenticated$,
    ]).pipe(
      take(1),
      map(([authReady, isAuthenticated]) => {
        // We only care about `isAuthenticated` once `authReady` is true
        if (isAuthenticated) {
          return true;
        } else {
          this.router.navigate(['/login']);
          return false;
        }
      })
    );
  }
}
