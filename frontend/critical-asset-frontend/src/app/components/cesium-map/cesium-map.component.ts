import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, Output, EventEmitter } from '@angular/core';
// import { environment } from '../../../environments/environment';
import * as Cesium from 'cesium';
import { SignalRService } from '../../services/signalr.service';
import { GeofenceService } from '../../services/geofence.service';
import { TelemetryPoint } from '../../models/telemetry-point.model';
import { Geofence, GeoPoint } from '../../models/geofence.model';
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
  @Output() geofenceCreated = new EventEmitter<Geofence>();
  @Output() violationDetected = new EventEmitter<any>();

  viewer?: Cesium.Viewer;

  private _destroy$ = new Subject<void>();

  /** Asset state */
  private _entities = new Map<string, Cesium.Entity>();
  private _lastTelemetry = new Map<string, TelemetryPoint>();
  private _trails = new Map<string, Cesium.Cartesian3[]>();
  private _positions = new Map<string, Cesium.Cartesian3>();

  private _initialZoomDone = false;

  /** Trail visibility state */
  trailsVisible = true;

  /** Geofence drawing state */
  isDrawingMode = false;
  drawingPoints: GeoPoint[] = [];
  drawingEntity?: Cesium.Entity;
  geofencePolylines = new Map<string, Cesium.Entity>();

  constructor(
    private signalRService: SignalRService,
    private geofenceService: GeofenceService
  ) { }

  ngAfterViewInit(): void {
    this._initViewer();
    this._subscribeTelemetry();
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();

    this._entities.clear();
    this._trails.clear();
    this._positions.clear();
    this._lastTelemetry.clear();
    this.geofencePolylines.clear();
    this.drawingPoints = [];

    this.viewer?.destroy();
  }


  upsertEntity(pt: TelemetryPoint) {
    const id = pt.assetId;
    const position = CesiumUtility.toCartesian(pt);
    this._positions.set(id, position);
    this._updateTrail(id, position);

    const previous = this._lastTelemetry.get(id);
    const hpr = CesiumHelper.computeOrientation(pt, previous);
    const orientation =
      pt.assetType === 'landVehicle'
        ? CesiumHelper.computeLandVehicleOrientation(pt)
        : Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

    const entity = this._entities.get(id);

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
      this._entities.set(id, this._createEntity(pt, position, orientation));
    }

    this._lastTelemetry.set(id, pt);
  }

  /**
   * Zoom camera to fit all entities in view
   */
  zoomToFitAll() {
    if (!this.viewer) {
      throw new Error('Cesium Viewer is not initialized');
    }
    const points = [...this._positions.values()];
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
    
    const position = this._positions.get(assetId);
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

  /**
   * Toggle trail visibility for all assets
   */
  toggleTrails(): void {
    this.trailsVisible = !this.trailsVisible;
    
    this._entities.forEach((entity) => {
      if (entity.polyline) {
        entity.polyline.show = new Cesium.ConstantProperty(this.trailsVisible);
      }
    });
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
        uri: CesiumUtility.getModelUri(CesiumUtility.parseAssetType(pt.assetType)),
        scale: 2,
        minimumPixelSize: 64
      },
      polyline: {
        positions: new Cesium.CallbackProperty(
          () => this._trails.get(id) ?? [],
          false
        ),
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

  private _updateTrail(id: string, position: Cesium.Cartesian3): void {
    const trail = this._trails.get(id) ?? [];
    trail.push(position);

    if (trail.length > 50) {
      trail.shift();
    }

    this._trails.set(id, trail);
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
      .pipe(takeUntil(this._destroy$))
      .subscribe(pt => {
        if (!pt) return;

        this.upsertEntity(pt);

        // Check geofence violations
        const violations = this.geofenceService.checkGeofenceViolations(pt.assetId, pt);
        violations.forEach(violation => {
          this.violationDetected.emit(violation);
        });

        if (!this._initialZoomDone && this._entities.size > 0) {
          this.zoomToFitAll();
          this._initialZoomDone = true;
        }
      });
  }

  /**
   * Start drawing a geofence polygon
   */
  startDrawingGeofence(): void {
    if (!this.viewer) return;

    this.isDrawingMode = true;
    this.drawingPoints = [];
    this.viewer.cesiumWidget.screenSpaceEventHandler.setInputAction(
      (click: any) => {
        this._handleMapClick(click);
      },
      Cesium.ScreenSpaceEventType.LEFT_CLICK
    );

    this.viewer.cesiumWidget.screenSpaceEventHandler.setInputAction(
      (dblClick: any) => {
        this._finishDrawingGeofence();
      },
      Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
    );

    console.log('Geofence drawing mode started. Click to add points, double-click to finish.');
  }

  /**
   * Cancel drawing mode
   */
  cancelDrawing(): void {
    if (!this.viewer) return;

    this.isDrawingMode = false;
    this.drawingPoints = [];

    if (this.drawingEntity) {
      this.viewer.entities.remove(this.drawingEntity);
      this.drawingEntity = undefined;
    }

    // Reset event handlers
    this.viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
      Cesium.ScreenSpaceEventType.LEFT_CLICK
    );
    this.viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
      Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
    );

    console.log('Drawing cancelled');
  }

  /**
   * Display a geofence polygon on the map
   */
  displayGeofence(geofence: Geofence): void {
    if (!this.viewer || this.geofencePolylines.has(geofence.id)) return;

    const positions = geofence.polygon.map(pt =>
      Cesium.Cartesian3.fromDegrees(pt.longitude, pt.latitude)
    );

    const polylineEntity = this.viewer.entities.add({
      polyline: {
        positions,
        width: 3,
        material: Cesium.Color.RED.withAlpha(0.9),
      },
      properties: {
        geofenceId: geofence.id,
        geofenceName: geofence.name
      }
    });

    this.geofencePolylines.set(geofence.id, polylineEntity);
  }

  /**
   * Remove geofence visualization
   */
  removeGeofenceDisplay(geofenceId: string): void {
    if (!this.viewer) return;

    const entity = this.geofencePolylines.get(geofenceId);
    if (entity) {
      this.viewer.entities.remove(entity);
      this.geofencePolylines.delete(geofenceId);
    }
  }

  /**
   * Get all current geofences
   */
  getAllGeofences(): Geofence[] {
    return this.geofenceService.getGeofences();
  }

  private _handleMapClick(click: any): void {
    if (!this.isDrawingMode || !this.viewer) return;

    const pickedObject = this.viewer.scene.pick(click.position);
    if (Cesium.defined(pickedObject)) {
      return; // Don't add point if clicking on an entity
    }

    const earthPosition = this.viewer.scene.pickPosition(click.position);
    if (!Cesium.defined(earthPosition)) {
      return;
    }

    const cartographic = Cesium.Cartographic.fromCartesian(earthPosition as Cesium.Cartesian3);
    const point: GeoPoint = {
      longitude: Cesium.Math.toDegrees(cartographic.longitude),
      latitude: Cesium.Math.toDegrees(cartographic.latitude)
    };

    this.drawingPoints.push(point);
    console.log(`Point added: ${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}`);

    // Update visualization
    this._updateDrawingVisualization();
  }

  private _finishDrawingGeofence(): void {
    if (this.drawingPoints.length < 3) {
      alert('A geofence must have at least 3 points');
      return;
    }

    // Create geofence
    const geofenceId = `geofence-${Date.now()}`;
    const geofence: Geofence = {
      id: geofenceId,
      name: `Geofence ${new Date().toLocaleTimeString()}`,
      polygon: [...this.drawingPoints],
      createdAt: new Date(),
      enabled: true,
      alertOnEntry: true,
      alertOnExit: true
    };

    this.geofenceService.addGeofence(geofence);
    this.displayGeofence(geofence);
    this.geofenceCreated.emit(geofence);

    console.log('Geofence created:', geofence);

    // Cancel drawing mode
    this.cancelDrawing();
  }

  private _updateDrawingVisualization(): void {
    if (!this.viewer) return;

    if (this.drawingEntity) {
      this.viewer.entities.remove(this.drawingEntity);
    }

    const positions = this.drawingPoints.map(pt =>
      Cesium.Cartesian3.fromDegrees(pt.longitude, pt.latitude)
    );

    if (positions.length > 0) {
      this.drawingEntity = this.viewer.entities.add({
        polyline: {
          positions: new Cesium.CallbackProperty(() => positions, false),
          width: 2,
          material: Cesium.Color.CYAN.withAlpha(0.8),
          clampToGround: true
        },
        point: {
          pixelSize: 8,
          color: Cesium.Color.RED,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2
        }
      });
    }
  }

}
