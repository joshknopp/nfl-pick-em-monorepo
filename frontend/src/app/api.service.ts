import { Injectable, inject } from '@angular/core';
import axios, { AxiosRequestConfig } from 'axios';
import { AuthService } from './auth.service';
import { EnvironmentService } from './environment.service';
import { Observable, from } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private environmentService = inject(EnvironmentService);
  private authService = inject(AuthService);

  get(path: string, config?: { anonymous?: boolean }): Observable<any> {
    const url = `${this.environmentService.getApiUrl()}/${path}`;
    const headers: Record<string, string> = {};
    if (!config?.anonymous) {
      const token = this.authService.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    const axiosConfig: AxiosRequestConfig = { headers };
    return from(axios.get(url, axiosConfig).then((response) => response.data));
  }

  post(
    path: string,
    data: any,
    config?: { anonymous?: boolean }
  ): Observable<any> {
    const url = `${this.environmentService.getApiUrl()}/${path}`;
    const headers: Record<string, string> = {};
    if (!config?.anonymous) {
      const token = this.authService.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    const axiosConfig: AxiosRequestConfig = { headers };
    return from(
      axios.post(url, data, axiosConfig).then((response) => response.data)
    );
  }
}
