import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { GeofenceViolation } from '../../models/geofence.model';
import { Subject, takeUntil, interval } from 'rxjs';

@Component({
  selector: 'app-geofence-alert',
  templateUrl: './geofence-alert.component.html',
  styleUrls: ['./geofence-alert.component.css'],
  imports: [CommonModule, DatePipe],
  animations: [
    trigger('blinking', [
      state('visible', style({
        opacity: 1,
        transform: 'scale(1)'
      })),
      state('hidden', style({
        opacity: 0.3,
        transform: 'scale(0.98)'
      })),
      transition('visible <=> hidden', animate('600ms ease-in-out'))
    ])
  ]
})
export class GeofenceAlertComponent implements OnInit, OnDestroy {
  @Input() violations: GeofenceViolation[] = [];
  @Input() autoHideDuration: number = 10000; // ms
  @Output() dismissed = new EventEmitter<void>();

  isVisible = true;
  blinkState = 'visible';

  private destroy$ = new Subject<void>();
  private blinkInterval$ = interval(600);
  private autoHideTimer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    if (this.violations.length > 0) {
      this._startBlinking();
      this._startAutoHide();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer);
    }
  }

  dismiss(): void {
    this.isVisible = false;
    this._stopBlinking();
    this.dismissed.emit();
  }

  getViolationIcon(violation: GeofenceViolation): string {
    return violation.violationType === 'ENTRY' ? '⚠️' : '⚡';
  }

  getViolationMessage(violation: GeofenceViolation): string {
    const type = violation.violationType === 'ENTRY' ? 'entered' : 'exited';
    return `Asset ${violation.assetId} ${type} geofence`;
  }

  private _startBlinking(): void {
    this.blinkInterval$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.blinkState = this.blinkState === 'visible' ? 'hidden' : 'visible';
      });
  }

  private _stopBlinking(): void {
    this.destroy$.next();
  }

  private _startAutoHide(): void {
    this.autoHideTimer = setTimeout(() => {
      this.dismiss();
    }, this.autoHideDuration);
  }
}
