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

  private _geofenceService = inject(GeofenceService)

  private _handler: Cesium.ScreenSpaceEventHandler | null = null;
  private _tempPoints: Cesium.Cartesian3[] = [];
  private _floatingPoint: Cesium.Entity | null = null;
  private _activeShapePoints: Cesium.Cartesian3[] = [];
  private _activeShape: Cesium.Entity | null = null;

  ngOnInit(): void {
    this._geofenceService.geofences$.subscribe(fences => {
      this.renderAllGeofences(fences);
    });
    this.loadGeofences();
  }

  togglePanel() {
    this.isPanelVisible = !this.isPanelVisible;
  }

  loadGeofences() {
    this.geofences = this._geofenceService.getGeofences();
  }

  toggleGeofenceEnabled(geofence: Geofence) {
    geofence.enabled = !geofence.enabled;
    this._geofenceService.addGeofence(geofence);
  }

  deleteGeofence(id: string) {
    this._geofenceService.removeGeofence(id);
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
    this._handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);

    // Add a point
    this._handler.setInputAction((event: any) => {
      const earthPosition = viewer.scene.pickPosition(event.position);
      if (Cesium.defined(earthPosition)) {
        this._tempPoints.push(earthPosition);
        if (this._tempPoints.length === 1) {
          this._activeShape = this.createShape(this._tempPoints);
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // Dynamic drawing
    this._handler.setInputAction((event: any) => {
      const newPosition = viewer.scene.pickPosition(event.endPosition);
      if (Cesium.defined(newPosition) && this._tempPoints.length > 0) {
        this._floatingPoint = newPosition;
        // Cesium Callback Property sayesinde poligon otomatik güncellenecek
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // Finish drawing
    this._handler.setInputAction(() => {
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
          const positions = this._floatingPoint
            ? [...points, this._floatingPoint]
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
    if (this._tempPoints.length < 3) return;

    const geoPoints: GeoPoint[] = this._tempPoints.map(cartesian => {
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

    this._geofenceService.addGeofence(newFence);
    this.geofences = this._geofenceService.getGeofences();
  }

  terminateDrawing() {
    const viewer = (window as any).viewer;
    this.isDrawing = false;
    this._handler?.destroy();
    this._handler = null;
    this._tempPoints = [];
    this._floatingPoint = null;
    if (this._activeShape) {
      viewer.entities.remove(this._activeShape);
      this._activeShape = null;
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

  zoomToGeofence(fence: Geofence) {
    const viewer = (window as any).viewer;
    if (!viewer) return;

    const entity = viewer.entities.getById(fence.id);

    if (entity) {
      viewer.zoomTo(entity, new Cesium.HeadingPitchRange(
        Cesium.Math.toRadians(0),
        Cesium.Math.toRadians(-45),
        0
      ));
    } else {
      const positions = Cesium.Cartesian3.fromDegreesArray(
        fence.polygon.flatMap(p => [p.longitude, p.latitude])
      );

      const boundingSphere = Cesium.BoundingSphere.fromPoints(positions);
      viewer.camera.flyToBoundingSphere(boundingSphere, {
        duration: 1.5
      });
    }
  }
}
