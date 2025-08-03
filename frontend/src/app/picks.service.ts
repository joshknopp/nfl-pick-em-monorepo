import { inject, Injectable } from '@angular/core';

import { PickDTO } from 'libs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class PicksService {
  private apiService = inject(ApiService);

  async getUserPicks(): Promise<PickDTO[]> {
    return await this.apiService.get('picks/user');
  }

  async getLeaguePicks(): Promise<PickDTO[]> {
    return await this.apiService.get('picks/league');
  }

  async saveUserPick(pick: PickDTO): Promise<PickDTO> {
    return await this.apiService.post('picks/user', pick);
  }
}
