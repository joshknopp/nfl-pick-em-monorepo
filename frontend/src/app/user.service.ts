import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiService = inject(ApiService);

  private displayNameSubject = new BehaviorSubject<string>('');
  displayName$ = this.displayNameSubject.asObservable();

  setDisplayName(name: string) {
    this.displayNameSubject.next(name);
  }

  getDisplayName(): string {
    return this.displayNameSubject.getValue();
  }

  async getUserDetails() {
    return await this.apiService.get('user');
  }
}
