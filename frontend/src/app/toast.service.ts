import { Injectable, signal } from '@angular/core';

export interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  toasts = signal<Toast[]>([]);

  show(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const newToast = { message, type };
    this.toasts.update(currentToasts => [...currentToasts, newToast]);
    setTimeout(() => this.remove(newToast), 5000);
  }

  remove(toast: Toast) {
    this.toasts.update(currentToasts => currentToasts.filter(t => t !== toast));
  }
}
