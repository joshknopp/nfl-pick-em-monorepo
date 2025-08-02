import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  async getUserDetails() {
    const token = this.authService.getToken();
    if (!token) return null;
    return await this.apiService.get('user', { token });
  }
}
