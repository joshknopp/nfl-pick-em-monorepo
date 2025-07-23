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

@Injectable({ providedIn: 'root' })
export class AuthService {
  user: User | null = null;
  token: string | null = null;

  private router = inject(Router);

  constructor() {
    onAuthStateChanged(auth, async (user) => {
      this.user = user;
      if (user) {
        this.token = await user.getIdToken();
      } else {
        this.token = null;
      }
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
    this.router.navigate(['/']);
  }

  isAuthenticated(): boolean {
    return !!this.user;
  }

  async getUserDetails() {
    if (!this.token) return null;
    const response = await axios.get(`${environment.apiUrl}/user`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    return response.data;
  }
}
