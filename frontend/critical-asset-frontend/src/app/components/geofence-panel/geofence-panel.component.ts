import { Component, Inject, OnInit } from '@angular/core';
import { Geofence } from '../../models/geofence.model';
import { GeofenceService } from '../../services/geofence.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {CdkDrag} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-geofence-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, CdkDrag],
  templateUrl: './geofence-panel.component.html',
  styleUrl: './geofence-panel.component.css',
})
export class GeofencePanelComponent implements OnInit {
  geofences: Geofence[] = [];
  isDrawing: boolean = false;

  private geofenceService = Inject(GeofenceService)

  ngOnInit(): void {
    this.loadGeofences();
  }

  loadGeofences() {
    this.geofences = this.geofenceService.getGeofences();
  }

  toggleGeofenceEnabled(geofence: Geofence) {
    geofence.enabled = !geofence.enabled;
    this.geofenceService.addGeofence(geofence);
  }

  deleteGeofence(id: string) {
    this.geofenceService.removeGeofence(id);
    this.loadGeofences();
    // TODO: Haritadan da silme event'i tetiklenecek
  }

  startNewDrawing() {
    this.isDrawing = !this.isDrawing;
    if (this.isDrawing) {
      // Haritayı çizim moduna sokacak bir event fırlatılabilir
      console.log("Drawing mode activated");
    }
  }
}
