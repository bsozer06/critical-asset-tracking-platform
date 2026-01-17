import { Component, inject, OnInit } from '@angular/core';
import { Geofence, GeoPoint } from '../../models/geofence.model';
import { GeofenceService } from '../../services/geofence.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDrag } from '@angular/cdk/drag-drop';
import * as Cesium from 'cesium';

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
  isPanelVisible: boolean = false;

  private geofenceService = inject(GeofenceService)

  private handler: Cesium.ScreenSpaceEventHandler | null = null;
  private tempPoints: Cesium.Cartesian3[] = [];
  private floatingPoint: Cesium.Entity | null = null;
  private activeShapePoints: Cesium.Cartesian3[] = [];
  private activeShape: Cesium.Entity | null = null;

  ngOnInit(): void {
    this.geofenceService.geofences$.subscribe(fences => {
      this.renderAllGeofences(fences);
    });
    this.loadGeofences();
  }

  togglePanel() {
    this.isPanelVisible = !this.isPanelVisible;
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
      this.prepareDrawing();
    } else {
      this.terminateDrawing();
    }
  }

  prepareDrawing() {
    const viewer = (window as any).viewer;
    this.handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);

    // Add a point
    this.handler.setInputAction((event: any) => {
      const earthPosition = viewer.scene.pickPosition(event.position);
      if (Cesium.defined(earthPosition)) {
        this.tempPoints.push(earthPosition);
        if (this.tempPoints.length === 1) {
          this.activeShape = this.createShape(this.tempPoints);
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // Dynamic drawing
    this.handler.setInputAction((event: any) => {
      const newPosition = viewer.scene.pickPosition(event.endPosition);
      if (Cesium.defined(newPosition) && this.tempPoints.length > 0) {
        this.floatingPoint = newPosition;
        // Cesium Callback Property sayesinde poligon otomatik güncellenecek
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // Finish drawing
    this.handler.setInputAction(() => {
      this.saveGeofence();
      this.terminateDrawing();
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
  }

  createShape(points: Cesium.Cartesian3[]) {
    const viewer = (window as any).viewer;
    return viewer.entities.add({
      polygon: {
        hierarchy: new Cesium.CallbackProperty(() => {
          // Mevcut noktalar + mouse'un o anki konumu
          const positions = this.floatingPoint
            ? [...points, this.floatingPoint]
            : points;
          return new Cesium.PolygonHierarchy(positions as Cesium.Cartesian3[]);
        }, false),
        material: Cesium.Color.fromCssColorString('#64b5f6').withAlpha(0.3),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString('#64b5f6'),
        heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
      }
    });
  }

  saveGeofence() {
    if (this.tempPoints.length < 3) return;

    const geoPoints: GeoPoint[] = this.tempPoints.map(cartesian => {
      const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
      return {
        latitude: Cesium.Math.toDegrees(cartographic.latitude),
        longitude: Cesium.Math.toDegrees(cartographic.longitude)
      };
    });

    const newFence: Geofence = {
      id: Math.random().toString(36).substr(2, 9),
      name: `New Zone ${this.geofences.length + 1}`,
      polygon: geoPoints,
      createdAt: new Date(),
      enabled: true,
      alertOnEntry: true,
      alertOnExit: true
    };

    this.geofenceService.addGeofence(newFence);
    this.geofences = this.geofenceService.getGeofences();
  }

  terminateDrawing() {
    const viewer = (window as any).viewer;
    this.isDrawing = false;
    this.handler?.destroy();
    this.handler = null;
    this.tempPoints = [];
    this.floatingPoint = null;
    if (this.activeShape) {
      viewer.entities.remove(this.activeShape);
      this.activeShape = null;
    }
  }

  renderAllGeofences(fences: Geofence[]) {
    const viewer = (window as any).viewer;
    if (!viewer) return;

    // remove all entitites firstly
    const geofenceEntities = viewer.entities.values.filter((e: any) => e.properties && e.properties.isGeofence);
    geofenceEntities.forEach((e: any) => viewer.entities.remove(e));

    // add all entitites on map
    fences.forEach(fence => {
      viewer.entities.add({
        id: fence.id, 
        name: fence.name,
        properties: { isGeofence: true }, 
        polygon: {
          hierarchy: Cesium.Cartesian3.fromDegreesArray(
            fence.polygon.flatMap(p => [p.longitude, p.latitude])
          ),
          material: fence.enabled
            ? Cesium.Color.fromCssColorString('#64b5f6').withAlpha(0.3)
            : Cesium.Color.GRAY.withAlpha(0.2),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString('#64b5f6'),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // Araziye yapıştır
          classificationType: Cesium.ClassificationType.BOTH // Hem araziyi hem 3D modelleri boya
        }
      });
    });
  }
}
