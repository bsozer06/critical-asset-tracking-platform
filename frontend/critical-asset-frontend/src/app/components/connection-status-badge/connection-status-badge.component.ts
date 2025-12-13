import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'connection-status-badge',
  imports: [CommonModule],
  templateUrl: './connection-status-badge.component.html',
  styleUrls: ['./connection-status-badge.component.css']
})
export class ConnectionStatusBadgeComponent {
  @Input() status: 'connected' | 'disconnected' | 'reconnecting' | 'error' = 'disconnected';
}
