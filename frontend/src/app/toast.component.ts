import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast) {
        <div [class]="'toast toast-' + toast.type" (click)="removeToast(toast)">
          {{ toast.message }}
        </div>
      }
    </div>
  `,
  styleUrls: ['./toast.css'],
})
export class ToastComponent {
  toastService = inject(ToastService);

  removeToast(toast: any) {
    this.toastService.remove(toast);
  }
}
