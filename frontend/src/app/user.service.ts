import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiService = inject(ApiService);

  async getUserDetails() {
    return await this.apiService.get('user');
  }
}
