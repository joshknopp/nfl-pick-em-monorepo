import { Injectable, inject } from '@angular/core';
import axios, { AxiosRequestConfig } from 'axios';
import { AuthService } from './auth.service';
import { EnvironmentService } from './environment.service';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private environmentService = inject(EnvironmentService);
  private authService = inject(AuthService);

  async get(path: string, config?: { anonymous?: boolean }) {
    const url = `${this.environmentService.getApiUrl()}/${path}`;
    const headers: Record<string, string> = {};
    if (!config?.anonymous) {
      const token = this.authService.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    const axiosConfig: AxiosRequestConfig = { headers };
    const response = await axios.get(url, axiosConfig);
    return response.data;
  }
}
