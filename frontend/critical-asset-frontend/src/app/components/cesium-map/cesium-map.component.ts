import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, Output, EventEmitter } from '@angular/core';
import { environment } from '../../../environments/environment';
import * as Cesium from 'cesium';
import { SignalRService } from '../../services/signalr.service';
import { CesiumViewerService } from '../../services/cesium-viewer.service';
import { TelemetryPoint } from '../../models/telemetry-point.model';
import { Geofence } from '../../models/geofence.model';
import { Subject, takeUntil } from 'rxjs';
import { CesiumUtility } from '../../utilities/cesium.utility';
import { CesiumHelper } from '../../helpers/cesium.helper';

interface AssetState {
  entity: Cesium.Entity;
  position: Cesium.Cartesian3;
  trail: Cesium.Cartesian3[];
  lastTelemetry: TelemetryPoint;
  lastUpdateTime: number;
}

@Component({
  selector: 'app-cesium-map',
  templateUrl: './cesium-map.component.html',
  styleUrls: ['./cesium-map.component.css']
})
export class CesiumMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('cesiumContainer', { static: true }) cesiumContainer!: ElementRef<HTMLDivElement>;
  @Output() geofenceCreated = new EventEmitter<Geofence>();

  viewer?: Cesium.Viewer;
  trailsVisible = true;

  private _destroy$ = new Subject<void>();
  private _assets = new Map<string, AssetState>();
  private _updateThrottleMs = 100;
  private _initialZoomDone = false;

  constructor(
    private _signalRService: SignalRService,
    private _cesiumViewerService: CesiumViewerService
  ) { }

  ngAfterViewInit(): void {
    this._initViewer();
    this._subscribeTelemetry();
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
    this._assets.clear();
    this.viewer?.destroy();
  }

  upsertEntity(pt: TelemetryPoint): void {
    const now = performance.now();
    const id = pt.assetId;
    const state = this._assets.get(id);

    if (state && now - state.lastUpdateTime < this._updateThrottleMs) return;

    const position = CesiumUtility.toCartesian(pt);
    const orientation = this._computeOrientation(pt, position, state?.lastTelemetry);
    const trail = this._buildTrail(state?.trail ?? [], position);

    if (state) {
      this._updateAssetEntity(state.entity, position, orientation);
      this._assets.set(id, { ...state, position, trail, lastTelemetry: pt, lastUpdateTime: now });
    } else {
      const entity = this._createEntity(pt, position, orientation);
      this._assets.set(id, { entity, position, trail, lastTelemetry: pt, lastUpdateTime: now });
    }
  }

  zoomToFitAll(): void {
    if (!this.viewer) throw new Error('Cesium Viewer is not initialized');

    const points = [...this._assets.values()].map(s => s.position);
    if (!points.length) return;

    if (points.length === 1) {
      this.viewer.camera.flyTo({
        destination: points[0],
        orientation: { pitch: Cesium.Math.toRadians(-45) },
        duration: 2
      });
      return;
    }

    const sphere = Cesium.BoundingSphere.fromPoints(points);
    this.viewer.camera.flyToBoundingSphere(sphere, { duration: 2 });
  }

  zoomToAsset(assetId: string): void {
    if (!this.viewer) return;

    const position = this._assets.get(assetId)?.position;
    if (!position) {
      console.warn(`Asset ${assetId} not found`);
      return;
    }

    try {
      this.viewer.camera.flyToBoundingSphere(
        new Cesium.BoundingSphere(position, 3),
        { duration: 1.5 }
      );
    } catch (error) {
      console.error('Error zooming to asset:', error);
    }
  }

  toggleTrails(): void {
    this.trailsVisible = !this.trailsVisible;
    this._assets.forEach(state => {
      if (state.entity.polyline) {
        state.entity.polyline.show = new Cesium.ConstantProperty(this.trailsVisible);
      }
    });
  }

  private _computeOrientation(
    pt: TelemetryPoint,
    position: Cesium.Cartesian3,
    previous?: TelemetryPoint
  ): Cesium.Quaternion {
    if (pt.assetType === 'landVehicle') {
      return CesiumHelper.computeLandVehicleOrientation(pt);
    }
    const hpr = CesiumHelper.computeOrientation(pt, previous);
    return Cesium.Transforms.headingPitchRollQuaternion(position, hpr);
  }

  private _updateAssetEntity(
    entity: Cesium.Entity,
    position: Cesium.Cartesian3,
    orientation: Cesium.Quaternion
  ): void {
    if (entity.orientation instanceof Cesium.ConstantProperty) {
      entity.orientation.setValue(orientation);
    } else {
      entity.orientation = new Cesium.ConstantProperty(orientation);
    }
    if (entity.position instanceof Cesium.ConstantPositionProperty) {
      entity.position.setValue(position);
    } else {
      entity.position = new Cesium.ConstantPositionProperty(position);
    }
  }

  private _createEntity(
    pt: TelemetryPoint,
    position: Cesium.Cartesian3,
    orientation: Cesium.Quaternion
  ): Cesium.Entity {
    if (!this.viewer) throw new Error('Cesium Viewer is not initialized');

    const id = pt.assetId;
    return this.viewer.entities.add({
      id,
      position,
      orientation: new Cesium.ConstantProperty(orientation),
      model: {
        uri: CesiumUtility.getModelUri(CesiumUtility.parseAssetType(pt.assetType)),
        scale: 2,
        minimumPixelSize: 64
      },
      polyline: {
        positions: new Cesium.CallbackProperty(() => this._assets.get(id)?.trail ?? [], false),
        width: 2,
        material: CesiumUtility.getTrailColor(CesiumUtility.parseAssetType(pt.assetType)),
        show: new Cesium.ConstantProperty(this.trailsVisible)
      },
      label: {
        text: `${id} (${pt.assetType})`,
        font: '14px sans-serif',
        pixelOffset: new Cesium.Cartesian2(0, -40),
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2
      }
    });
  }

  private _buildTrail(trail: Cesium.Cartesian3[], position: Cesium.Cartesian3): Cesium.Cartesian3[] {
    trail.push(position);
    if (trail.length > 20) trail.shift();
    return trail;
  }

  private _initViewer(): void {
    if (environment.cesiumIonToken) {
      Cesium.Ion.defaultAccessToken = environment.cesiumIonToken;
    }

    this.viewer = new Cesium.Viewer(this.cesiumContainer.nativeElement, {
      terrain: Cesium.Terrain.fromWorldTerrain(),
      timeline: false,
      animation: false,
      baseLayerPicker: false,
      sceneModePicker: false,
    });

    this._cesiumViewerService.setViewer(this.viewer);
  }

  private _subscribeTelemetry(): void {
    this._signalRService.telemetry$
      .pipe(takeUntil(this._destroy$))
      .subscribe(pt => {
        if (!pt) return;

        this.upsertEntity(pt);

        if (!this._initialZoomDone && this._assets.size > 0) {
          this.zoomToFitAll();
          this._initialZoomDone = true;
        }
      });
  }
}
