import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';
import { EnvironmentService } from './environment.service';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private environmentService = inject(EnvironmentService);
  private authService = inject(AuthService);
  private http = inject(HttpClient);

  get(path: string, config?: { anonymous?: boolean }): Observable<any> {
    const url = `${this.environmentService.getApiUrl()}/${path}`;
    let headers = new HttpHeaders();
    if (!config?.anonymous) {
      const token = this.authService.getToken();
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }
    return this.http.get(url, { headers });
  }

  post(
    path: string,
    data: any,
    config?: { anonymous?: boolean }
  ): Observable<any> {
    const url = `${this.environmentService.getApiUrl()}/${path}`;
    let headers = new HttpHeaders();
    if (!config?.anonymous) {
      const token = this.authService.getToken();
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }
    return this.http.post(url, data, { headers });
  }

  put(
    path: string,
    data: any,
    config?: { anonymous?: boolean }
  ): Observable<any> {
    const url = `${this.environmentService.getApiUrl()}/${path}`;
    let headers = new HttpHeaders();
    if (!config?.anonymous) {
      const token = this.authService.getToken();
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }
    return this.http.put(url, data, { headers });
  }
}
