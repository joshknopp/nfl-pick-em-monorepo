import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-week-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './week-selector.component.html',
  styleUrls: ['./week-selector.component.css'],
})
export class WeekSelectorComponent {
  @Input() selectedWeek: number = 1;
  @Input() minWeek: number = 1;
  @Input() maxWeek: number = 18;

  @Output() previous = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();

  goToPreviousWeek() {
    this.previous.emit();
  }

  goToNextWeek() {
    this.next.emit();
  }
}
