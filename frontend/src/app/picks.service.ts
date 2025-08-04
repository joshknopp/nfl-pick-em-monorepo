import { inject, Injectable } from '@angular/core';

import { PickDTO } from 'libs';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class PicksService {
  private apiService = inject(ApiService);

  getUserPicks(): Observable<PickDTO[]> {
    return this.apiService.get('picks/user');
  }

  getLeaguePicks(): Observable<PickDTO[]> {
    return this.apiService.get('picks/league');
  }

  saveUserPick(pick: PickDTO): Observable<PickDTO> {
    return this.apiService.post('picks/user', pick);
  }
}
