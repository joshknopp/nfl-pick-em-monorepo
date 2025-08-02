import { environment } from '../environments/environment';
import { Injectable, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class EnvironmentService {
  getApiUrl(): string {
    if (typeof window !== 'undefined') {
      const { hostname, protocol } = window.location;
      // Check for domain ending with -4200.app.github.dev
      const match = hostname.match(/^(.*)-4200\.app\.github\.dev$/);
      if (match) {
        // Replace 4200 with 3000 in the domain
        const newHost = hostname.replace(
          '-4200.app.github.dev',
          '-3000.app.github.dev'
        );
        return `${protocol}//${newHost}`;
      }
    }
    return environment.apiUrl;
  }
}
