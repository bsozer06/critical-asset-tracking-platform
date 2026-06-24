import { effect, inject, Injectable } from '@angular/core';
import { Geofence } from '../models/geofence.model';
import { GeofenceService } from './geofence.service';
import { CesiumViewerService } from './cesium-viewer.service';
import * as Cesium from 'cesium';

@Injectable({ providedIn: 'root' })
export class GeofenceRendererService {
  private _geofenceService = inject(GeofenceService);
  private _cesiumViewerService = inject(CesiumViewerService);

  constructor() {
    effect(() => {
      this._renderAll(this._geofenceService.geofences());
    });
  }

  zoomTo(fence: Geofence): void {
    const viewer = this._cesiumViewerService.getViewer();
    if (!viewer) return;

    const entity = viewer.entities.getById(fence.id);
    if (entity) {
      viewer.zoomTo(entity, new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-90), 0));
    }
  }

  private _renderAll(fences: Geofence[]): void {
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
}
