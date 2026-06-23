import { inject, Injectable, signal } from '@angular/core';
import { GeoPoint } from '../models/geofence.model';
import { GeofenceService } from './geofence.service';
import { CesiumViewerService } from './cesium-viewer.service';
import * as Cesium from 'cesium';

@Injectable({ providedIn: 'root' })
export class GeofenceDrawingService {
  private _geofenceService = inject(GeofenceService);
  private _cesiumViewerService = inject(CesiumViewerService);

  isDrawing = signal(false);

  private _handler: Cesium.ScreenSpaceEventHandler | null = null;
  private _tempPoints: Cesium.Cartesian3[] = [];
  private _floatingPoint: Cesium.Cartesian3 | null = null;
  private _activeShape: Cesium.Entity | null = null;

  toggle(): void {
    if (this.isDrawing()) {
      this._stop();
    } else {
      this._start();
    }
  }

  private _start(): void {
    const viewer = this._cesiumViewerService.getViewer();
    if (!viewer) return;

    this.isDrawing.set(true);
    this._handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);

    this._handler.setInputAction((event: any) => {
      const earthPosition = viewer.scene.pickPosition(event.position);
      if (Cesium.defined(earthPosition)) {
        this._tempPoints.push(earthPosition);
        if (this._tempPoints.length === 1) {
          this._activeShape = this._createShape(viewer, this._tempPoints);
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
      this._save();
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
  }

  private _stop(): void {
    const viewer = this._cesiumViewerService.getViewer();
    this._handler?.destroy();
    this._handler = null;
    this._tempPoints = [];
    this._floatingPoint = null;
    if (this._activeShape && viewer) {
      viewer.entities.remove(this._activeShape);
      this._activeShape = null;
    }
    this.isDrawing.set(false);
  }

  private _save(): void {
    if (this._tempPoints.length < 3) return;

    const geoPoints: GeoPoint[] = this._tempPoints.map(cartesian => {
      const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
      return {
        longitude: Cesium.Math.toDegrees(cartographic.longitude),
        latitude: Cesium.Math.toDegrees(cartographic.latitude)
      };
    });

    const fencePayload = {
      name: `Zone ${this._geofenceService.geofences().length + 1}`,
      description: 'User Defined Area',
      alertOnEntry: true,
      alertOnExit: true,
      coordinates: geoPoints.map(p => ({ latitude: p.latitude, longitude: p.longitude }))
    };

    this._geofenceService.saveGeofence(fencePayload).subscribe({
      next: () => this._stop(),
      error: (err) => console.error('Save failed:', err)
    });
  }

  private _createShape(viewer: Cesium.Viewer, points: Cesium.Cartesian3[]): Cesium.Entity {
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
}
