import { Component, inject } from '@angular/core';
import { map } from 'rxjs';
import { Geofence } from '../../models/geofence.model';
import { GeofenceService } from '../../services/geofence.service';
import { GeofenceDrawingService } from '../../services/geofence-drawing.service';
import { GeofenceRendererService } from '../../services/geofence-renderer.service';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { CdkDrag } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-geofence-panel',
  standalone: true,
  imports: [CommonModule, CdkDrag],
  templateUrl: './geofence-panel.component.html',
  styleUrl: './geofence-panel.component.css',
})
export class GeofencePanelComponent {
  private _geofenceService = inject(GeofenceService);
  private _drawingService = inject(GeofenceDrawingService);
  private _rendererService = inject(GeofenceRendererService);
  private _authService = inject(AuthService);
  readonly isAdmin$ = this._authService.currentUser$.pipe(map(u => u?.role === 'Admin'));

  isPanelVisible = false;
  geofenceToDelete: Geofence | null = null;

  readonly geofences = this._geofenceService.geofences;
  readonly isDrawing = this._drawingService.isDrawing;

  togglePanel(): void {
    this.isPanelVisible = !this.isPanelVisible;
  }

  startNewDrawing(): void {
    this._drawingService.toggle();
  }

  toggleGeofenceEnabled(geofence: Geofence): void {
    this._geofenceService.toggleGeofenceActive(geofence.id, !geofence.isActive).subscribe();
  }

  zoomToGeofence(fence: Geofence): void {
    this._rendererService.zoomTo(fence);
  }

  openDeleteConfirm(geofence: Geofence): void {
    this.geofenceToDelete = geofence;
  }

  cancelDelete(): void {
    this.geofenceToDelete = null;
  }

  confirmDelete(): void {
    if (!this.geofenceToDelete) return;
    this._geofenceService.deleteGeofence(this.geofenceToDelete.id).subscribe({
      next: () => { this.geofenceToDelete = null; },
      error: (err) => console.error('Delete failed:', err)
    });
  }
}
