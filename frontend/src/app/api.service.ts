import axios, { AxiosRequestConfig } from 'axios';
import { Injectable, inject } from '@angular/core';
import { EnvironmentService } from './environment.service';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private environmentService = inject(EnvironmentService);

  async get(path: string, config?: { anonymous?: boolean; token?: string }) {
    const url = `${this.environmentService.getApiUrl()}/${path}`;
    const headers: Record<string, string> = {};
    if (!config?.anonymous && config?.token) {
      headers['Authorization'] = `Bearer ${config.token}`;
    }
    const axiosConfig: AxiosRequestConfig = { headers };
    const response = await axios.get(url, axiosConfig);
    return response.data;
  }
}
