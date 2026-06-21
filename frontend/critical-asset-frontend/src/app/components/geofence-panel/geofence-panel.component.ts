import { Component, inject, Signal, effect } from '@angular/core';
import { Geofence, GeoPoint } from '../../models/geofence.model';
import { GeofenceService } from '../../services/geofence.service';
import { CesiumViewerService } from '../../services/cesium-viewer.service';
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
export class GeofencePanelComponent {
  private _geofenceService = inject(GeofenceService);
  private _cesiumViewerService = inject(CesiumViewerService);

  isDrawing = false;
  isPanelVisible = false;

  public geofences: Signal<Geofence[]> = this._geofenceService.geofences;

  private _handler: Cesium.ScreenSpaceEventHandler | null = null;
  private _tempPoints: Cesium.Cartesian3[] = [];
  private _floatingPoint: Cesium.Cartesian3 | null = null;
  private _activeShape: Cesium.Entity | null = null;

  constructor() {
    effect(() => {
      const fences = this.geofences();
      this.renderAllGeofences(fences);
    });
  }

  togglePanel(): void {
    this.isPanelVisible = !this.isPanelVisible;
  }

  toggleGeofenceEnabled(geofence: Geofence): void {
    const updatePayload = { ...geofence, isActive: !geofence.isActive };
    this._geofenceService.saveGeofence(updatePayload).subscribe();
  }

  deleteGeofence(_id: string): void {
    // this._geofenceService.removeGeofence(id);
  }

  startNewDrawing(): void {
    this.isDrawing = !this.isDrawing;
    if (this.isDrawing) {
      this.prepareDrawing();
    } else {
      this.terminateDrawing();
    }
  }

  prepareDrawing(): void {
    const viewer = this._cesiumViewerService.getViewer();
    if (!viewer) return;

    this._handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);

    this._handler.setInputAction((event: any) => {
      const earthPosition = viewer.scene.pickPosition(event.position);
      if (Cesium.defined(earthPosition)) {
        this._tempPoints.push(earthPosition);
        if (this._tempPoints.length === 1) {
          this._activeShape = this.createShape(this._tempPoints);
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    this._handler.setInputAction((event: any) => {
      const newPosition = viewer.scene.pickPosition(event.endPosition);
      if (Cesium.defined(newPosition) && this._tempPoints.length > 0) {
        this._floatingPoint = newPosition;
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    this._handler.setInputAction(() => {
      this.saveGeofence();
      this.terminateDrawing();
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
  }

  createShape(points: Cesium.Cartesian3[]): Cesium.Entity | null {
    const viewer = this._cesiumViewerService.getViewer();
    if (!viewer) return null;

    return viewer.entities.add({
      polygon: {
        hierarchy: new Cesium.CallbackProperty(() => {
          const positions = this._floatingPoint
            ? [...points, this._floatingPoint]
            : points;
          return new Cesium.PolygonHierarchy(positions);
        }, false),
        material: Cesium.Color.fromCssColorString('#64b5f6').withAlpha(0.3),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString('#64b5f6'),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
      }
    });
  }

  saveGeofence(): void {
    if (this._tempPoints.length < 3) return;

    const geoPoints: GeoPoint[] = this._tempPoints.map(cartesian => {
      const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
      return {
        longitude: Cesium.Math.toDegrees(cartographic.longitude),
        latitude: Cesium.Math.toDegrees(cartographic.latitude)
      };
    });

    const fencePayload = {
      name: `Zone ${this.geofences().length + 1}`,
      description: 'User Defined Area',
      alertOnEntry: true,
      alertOnExit: true,
      coordinates: geoPoints.map(p => ({ latitude: p.latitude, longitude: p.longitude }))
    };

    this._geofenceService.saveGeofence(fencePayload).subscribe({
      next: () => {
        this.terminateDrawing();
        this.isDrawing = false;
      },
      error: (err) => console.error('Save failed:', err)
    });
  }

  terminateDrawing(): void {
    const viewer = this._cesiumViewerService.getViewer();
    this._handler?.destroy();
    this._handler = null;
    this._tempPoints = [];
    this._floatingPoint = null;
    if (this._activeShape && viewer) {
      viewer.entities.remove(this._activeShape);
      this._activeShape = null;
    }
  }

  renderAllGeofences(fences: Geofence[]): void {
    const viewer = this._cesiumViewerService.getViewer();
    if (!viewer) return;

    const existing = viewer.entities.values.filter((e: any) => e.properties?.isGeofence);
    existing.forEach((e: any) => viewer.entities.remove(e));

    fences.forEach(fence => {
      const points = fence.polygonPoints ?? [];
      if (points.length < 3) return;

      viewer.entities.add({
        id: fence.id,
        name: fence.name,
        properties: { isGeofence: true },
        polygon: {
          hierarchy: Cesium.Cartesian3.fromDegreesArray(
            points.flatMap(p => [p.longitude, p.latitude])
          ),
          material: fence.isActive
            ? Cesium.Color.fromCssColorString('#64b5f6').withAlpha(0.3)
            : Cesium.Color.GRAY.withAlpha(0.2),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString('#64b5f6'),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          classificationType: Cesium.ClassificationType.BOTH
        }
      });
    });
  }

  zoomToGeofence(fence: Geofence): void {
    const viewer = this._cesiumViewerService.getViewer();
    if (!viewer) return;

    const entity = viewer.entities.getById(fence.id);
    if (entity) {
      viewer.zoomTo(entity, new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-90), 0));
    }
  }
}
