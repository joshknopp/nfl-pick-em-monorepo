import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { auth, googleProvider, facebookProvider } from '../firebase';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
  onAuthStateChanged,
} from 'firebase/auth';
import { environment } from '../environments/environment';
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';
import { EnvironmentService } from './environment.service';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  user: User | null = null;
  token: string | null = null;

  private _isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  isAuthenticated$: Observable<boolean> =
    this._isAuthenticatedSubject.asObservable();

  private _authReady = new ReplaySubject<boolean>(1);
  authReady$: Observable<boolean> = this._authReady.asObservable();

  private router = inject(Router);
  private environmentService = inject(EnvironmentService);
  private apiService = inject(ApiService);

  constructor() {
    onAuthStateChanged(auth, async (user) => {
      this.user = user;
      if (user) {
        this.token = await user.getIdToken();
        this._isAuthenticatedSubject.next(true);
      } else {
        this.token = null;
        this._isAuthenticatedSubject.next(false);
      }
      // Signal that Firebase Auth has completed its initial state check
      this._authReady.next(true);
      this._authReady.complete(); // It only needs to emit once
    });
  }

  async loginWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    this.user = result.user;
    this.token = await result.user.getIdToken();
    this.router.navigate(['/games']);
  }

  async loginWithFacebook() {
    const result = await signInWithPopup(auth, facebookProvider);
    this.user = result.user;
    this.token = await result.user.getIdToken();
    this.router.navigate(['/games']);
  }

  async loginWithEmail(email: string, password: string) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    this.user = result.user;
    this.token = await result.user.getIdToken();
    this.router.navigate(['/games']);
  }

  async registerWithEmail(email: string, password: string) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    this.user = result.user;
    this.token = await result.user.getIdToken();
    this.router.navigate(['/games']);
  }

  async logout() {
    await signOut(auth);
    this.user = null;
    this.token = null;
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.token;
  }
}
