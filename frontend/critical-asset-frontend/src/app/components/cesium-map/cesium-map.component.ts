import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { environment } from '../../../environments/environment';
import * as Cesium from 'cesium';
import { SignalRService } from '../../services/signalr.service';
import { TelemetryPoint } from '../../models/telemetry-point.model';
import { Subject, takeUntil } from 'rxjs';
import { CesiumUtility } from '../../utilities/cesium.utility';
import { CesiumHelper } from '../../helpers/cesium.helper';

@Component({
  selector: 'app-cesium-map',
  templateUrl: './cesium-map.component.html',
  styleUrls: ['./cesium-map.component.css']
})
export class CesiumMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('cesiumContainer', { static: true }) cesiumContainer!: ElementRef<HTMLDivElement>;
  viewer?: Cesium.Viewer;

  private destroy$ = new Subject<void>();

  /** Asset state */
  private entities = new Map<string, Cesium.Entity>();
  private lastTelemetry = new Map<string, TelemetryPoint>();
  private trails = new Map<string, Cesium.Cartesian3[]>();
  private positions = new Map<string, Cesium.Cartesian3>();

  private initialZoomDone = false;

  constructor(private signalRService: SignalRService) { }

  ngAfterViewInit(): void {
    this._initViewer();
    this._subscribeTelemetry();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    this.entities.clear();
    this.trails.clear();
    this.positions.clear();
    this.lastTelemetry.clear();

    this.viewer?.destroy();
  }


  upsertEntity(pt: TelemetryPoint) {
    const id = pt.assetId;
    const position = CesiumUtility.toCartesian(pt);
    this.positions.set(id, position);
    this._updateTrail(id, position);

    const previous = this.lastTelemetry.get(id);
    const hpr = CesiumHelper.computeOrientation(pt, previous);
    const orientation =
      pt.assetType === 'LandVehicle'
        ? CesiumHelper.computeLandVehicleOrientation(pt)
        : Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

    const entity = this.entities.get(id);

    if (entity) {
      // Increase performance by updating for existing orientation property
      if (entity.orientation instanceof Cesium.ConstantProperty) {
        entity.orientation.setValue(orientation);
      } else {
        entity.orientation = new Cesium.ConstantProperty(orientation);
      }
      // Increase performance by updating for existing position property
      if (entity.position instanceof Cesium.ConstantPositionProperty) {
        entity.position.setValue(position);
      } else {
        entity.position = new Cesium.ConstantPositionProperty(position);
      }
    } else {
      this.entities.set(id, this._createEntity(pt, position, orientation));
    }

    this.lastTelemetry.set(id, pt);
  }

  /**
   * Zoom camera to fit all entities in view
   */
  zoomToFitAll() {
    if (!this.viewer) {
      throw new Error('Cesium Viewer is not initialized');
    }
    const points = [...this.positions.values()];
    if (!points.length) return;

    if (points.length === 1) {
      this.viewer.camera.flyTo({
        destination: points[0],
        orientation: {
          pitch: Cesium.Math.toRadians(-45)
        },
        duration: 2
      });
      return;
    }

    const sphere = Cesium.BoundingSphere.fromPoints(points);
    this.viewer.camera.flyToBoundingSphere(sphere, { duration: 2 });
  }

  /**
   * Zoom camera to a specific asset
   */
  zoomToAsset(assetId: string) {
    if (!this.viewer) return;
    
    const position = this.positions.get(assetId);
    if (!position) {
      console.warn(`Asset ${assetId} not found`);
      return;
    }

    try {
      this.viewer.camera.flyToBoundingSphere(new Cesium.BoundingSphere(position, 3), {
        duration: 1.5
      });
    } catch (error) {
      console.error('Error zooming to asset:', error);
    }
  }

  private _createEntity(
    pt: TelemetryPoint,
    position: Cesium.Cartesian3,
    orientation: Cesium.Quaternion
  ): Cesium.Entity {
    if (!this.viewer) {
      throw new Error('Cesium Viewer is not initialized');
    }

    const id = pt.assetId;

    return this.viewer.entities.add({
      id,
      position,
      orientation: new Cesium.ConstantProperty(orientation),
      model: {
        uri: CesiumUtility.getModelUri(pt.assetType),
        scale: 2,
        minimumPixelSize: 64
      },
      polyline: {
        positions: new Cesium.CallbackProperty(
          () => this.trails.get(id) ?? [],
          false
        ),
        width: 2,
        material: CesiumUtility.getTrailColor(pt.assetType)
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

  private _updateTrail(id: string, position: Cesium.Cartesian3): void {
    const trail = this.trails.get(id) ?? [];
    trail.push(position);

    if (trail.length > 50) {
      trail.shift();
    }

    this.trails.set(id, trail);
  }

  private _initViewer(): void {
    // configure baseUrl for static assets
    // (Cesium as any).buildModuleUrl.setBaseUrl(environment.cesiumBaseUrl);

    this.viewer = new Cesium.Viewer(this.cesiumContainer.nativeElement, {
      timeline: false,
      animation: false,
      baseLayerPicker: true,
      shadows: false,
      terrainProvider: new Cesium.EllipsoidTerrainProvider(),
      skyAtmosphere: false,
    });
    // // optionally set Ion token (if provided)
    // if (environment.cesiumIonToken) {
    //   Cesium.Ion.defaultAccessToken = environment.cesiumIonToken;
    // }
  }

  private _subscribeTelemetry(): void {
    this.signalRService.telemetry$
      .pipe(takeUntil(this.destroy$))
      .subscribe(pt => {
        if (!pt) return;

        this.upsertEntity(pt);

        if (!this.initialZoomDone && this.entities.size > 0) {
          this.zoomToFitAll();
          this.initialZoomDone = true;
        }
      });
  }

}
