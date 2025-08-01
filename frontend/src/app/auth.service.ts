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
import axios from 'axios';
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs'; // Import ReplaySubject
import { map, first, take, tap } from 'rxjs/operators'; // Import operators

@Injectable({ providedIn: 'root' })
export class AuthService {
  user: User | null = null;
  token: string | null = null;

  private _isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  isAuthenticated$: Observable<boolean> =
    this._isAuthenticatedSubject.asObservable();

  // New: Subject to signal when Firebase Auth has finished its initial check
  private _authReady = new ReplaySubject<boolean>(1); // Emits the last value to new subscribers
  authReady$: Observable<boolean> = this._authReady.asObservable();

  private router = inject(Router);

  constructor() {
    onAuthStateChanged(auth, async (user) => {
      this.user = user;
      if (user) {
        this.token = await user.getIdToken();
        this._isAuthenticatedSubject.next(true); // User is logged in
      } else {
        this.token = null;
        this._isAuthenticatedSubject.next(false); // No user is logged in
      }
      // Signal that Firebase Auth has completed its initial state check
      this._authReady.next(true);
      this._authReady.complete(); // It only needs to emit once
    });
  }

  // --- Login/Logout/Register methods (no changes needed here) ---

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

  async getUserDetails() {
    if (!this.getToken()) return null;
    const response = await axios.get(`${environment.apiUrl}/user`, {
      headers: { Authorization: `Bearer ${this.getToken()}` },
    });
    return response.data;
  }
}
