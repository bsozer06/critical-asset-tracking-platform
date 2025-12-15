import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { environment } from '../../../environments/environment';
import * as Cesium from 'cesium';
import { SignalRService } from '../../services/signalr.service';
import { TelemetryPoint } from '../../models/telemetry-point.model';

@Component({
  selector: 'app-cesium-map',
  templateUrl: './cesium-map.component.html',
  styleUrls: ['./cesium-map.component.css']
})
export class CesiumMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('cesiumContainer', { static: true }) cesiumContainer!: ElementRef<HTMLDivElement>;
  viewer?: Cesium.Viewer;

  // simple map of assetId -> entity
  private entitiesMap = new Map<string, Cesium.Entity>();

  private subscription: any;
  private lastTelemetry = new Map<string, TelemetryPoint>();
  private trails = new Map<string, Cesium.Cartesian3[]>();
  private initialZoomDone = false;
  private entityPositions = new Map<string, Cesium.Cartesian3>();

  constructor(private signalRService: SignalRService) { }

  ngAfterViewInit(): void {
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

    // subscribe to telemetry stream
    this.subscription = this.signalRService.telemetry$.subscribe((pt) => {
      if (!pt) { return; }
      this.upsertEntity(pt);
      
      // Do initial zoom after we have some entities
      if (!this.initialZoomDone && this.entitiesMap.size >= 1) {
        this.zoomToFitAll();
        this.initialZoomDone = true;
      }
    });
  }

  upsertEntity(pt: TelemetryPoint) {
    if (!this.viewer) { return; }

    const id = pt.assetId;
    const existing = this.entitiesMap.get(id);
    const position = Cesium.Cartesian3.fromDegrees(pt.longitude, pt.latitude, pt.altitudeMeters ?? 0);
    
    // Store position for zoom calculations
    this.entityPositions.set(id, position);
    
    let trail = this.trails.get(id);
    if (!trail) {
      trail = [];
      this.trails.set(id, trail);
    }

    trail.push(position);

    // max number of points (for performance)
    if (trail.length > 50) {
      trail.shift();
    }
    const previous = this.lastTelemetry.get(id);
    const hpr = this.computeOrientation(pt, previous);
    const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

    if (existing) {
      existing.position = new Cesium.ConstantPositionProperty(position);
      existing.orientation = new Cesium.ConstantProperty(orientation);
    } else {
      const entity = this.addPlaneEntity(pt, position, hpr, orientation);
      if (!entity) {
        console.log('Entity could not be created for', pt);
        return;
      }
      this.entitiesMap.set(id, entity);
    }
    this.lastTelemetry.set(id, pt);

  }

  /**
   * Zoom camera to fit all entities in view
   */
  zoomToFitAll() {
    if (!this.viewer || this.entityPositions.size === 0) {
      return;
    }

    try {
      const positions = Array.from(this.entityPositions.values());
      
      if (positions.length === 1) {
        // For single entity, zoom with HeadingPitchRange for precise positioning
        const position = positions[0];
        console.log('position', position);
        
        this.viewer.camera.flyTo({
          destination: position,
          orientation: {
            heading: Cesium.Math.toRadians(0),
            pitch: Cesium.Math.toRadians(-45),
            roll: 0
          },
          duration: 2.0
        });
      } else {
        // For multiple entities, calculate bounding sphere with better framing
        const boundingSphere = Cesium.BoundingSphere.fromPoints(positions);
        
        this.viewer.camera.flyToBoundingSphere(boundingSphere, {
          duration: 2.0,
        });
      }
    } catch (error) {
      console.error('Error zooming to fit all entities:', error);
    }
  }

  /**
   * Zoom camera to a specific asset
   */
  zoomToAsset(assetId: string) {
    if (!this.viewer) {
      return;
    }

    const position = this.entityPositions.get(assetId);
    if (!position) {
      console.warn(`Asset ${assetId} not found`);
      return;
    }

    try {
      // Get altitude to adjust zoom distance
      const cartographic = Cesium.Cartographic.fromCartesian(position);
      const altitude = cartographic.height || 0;
      
      // Calculate distance based on altitude (higher altitude = more distance)
      const baseDistance = 10000;
      const altitudeDistance = Math.max(altitude * 0.5, 0);
      const totalDistance = baseDistance + altitudeDistance;

      this.viewer.camera.flyToBoundingSphere(new Cesium.BoundingSphere(position, 3), {
        duration: 1.5
      });
    } catch (error) {
      console.error('Error zooming to asset:', error);
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.trails.clear();
    this.entitiesMap.clear();
    this.lastTelemetry.clear();
    this.entityPositions.clear();
    if (this.viewer) {
      this.viewer.destroy();
    }
  }

  addPlaneEntity(pt: TelemetryPoint, position: Cesium.Cartesian3, hpr: Cesium.HeadingPitchRoll, orientation: Cesium.Quaternion): Cesium.Entity | undefined {
    const id = pt.assetId;
    // pick model based on assetType; fallback to Cesium_Air
    const MODEL_BY_TYPE: Record<string, string> = {
      Aircraft: 'assets/models/Cesium_Air.glb',
      Drone: 'assets/models/Drone.glb',
      LandVehicle: 'assets/models/GroundVehicle.glb',
      Person: 'assets/models/Person.glb',
      Ship: 'assets/models/Ship.glb'
    };

    const modelUri = (pt.assetType && MODEL_BY_TYPE[pt.assetType]) ?? 'assets/models/Cesium_Air.glb';
    
    // For land vehicles, use simplified orientation (heading only)
    // For aircraft and others, use full orientation with pitch and roll
    const entityOrientation = pt.assetType === 'LandVehicle' 
      ? this.computeLandVehicleOrientation(pt)
      : orientation;

    // Different trail colors for different asset types
    const trailColor = pt.assetType === 'LandVehicle' 
      ? Cesium.Color.YELLOW.withAlpha(0.7)
      : Cesium.Color.CYAN.withAlpha(0.7);

    const entity = this.viewer?.entities.add({
      id: id,
      position,
      orientation: entityOrientation,
      model: {
        uri: modelUri,
        scale: 2.0,
        minimumPixelSize: 64,
        maximumScale: 200,
        heightReference: Cesium.HeightReference.NONE
      },
      polyline: {
        positions: new Cesium.CallbackProperty(() => {
          return this.trails.get(id) ?? [];
        }, false),
        width: 2,
        material: trailColor
      },
      label: {
        text: `${id} (${pt.assetType})`,
        font: '14px sans-serif',
        fillColor: Cesium.Color.WHITE,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        outlineWidth: 2,
        outlineColor: Cesium.Color.BLACK,
        pixelOffset: new Cesium.Cartesian2(0, -40)
      }
    });
    return entity;
  }

  private computeLandVehicleOrientation(pt: TelemetryPoint): Cesium.Quaternion {
    const position = Cesium.Cartesian3.fromDegrees(pt.longitude, pt.latitude, pt.altitudeMeters ?? 0);
    
    // For land vehicles, only use heading (no pitch or roll)
    const MODEL_HEADING_OFFSET_DEG = -90;
    const heading = Cesium.Math.toRadians((pt.headingDegrees ?? 0) + MODEL_HEADING_OFFSET_DEG);
    
    // No pitch or roll for ground vehicles
    const hpr = new Cesium.HeadingPitchRoll(heading, 0, 0);
    return Cesium.Transforms.headingPitchRollQuaternion(position, hpr);
  }

  private computeOrientation(
    current: TelemetryPoint,
    previous?: TelemetryPoint
  ): Cesium.HeadingPitchRoll {

    // Some glTF models don't use Cesium's forward axis convention.
    // Tweak this offset (degrees) to align the model nose with the heading.
    const MODEL_HEADING_OFFSET_DEG = -90; // adjust if model faces wrong way

    const heading = Cesium.Math.toRadians((current.headingDegrees ?? 0) + MODEL_HEADING_OFFSET_DEG);

    let pitch = 0;
    let roll = 0;

    if (previous) {
      // ----- PITCH (climb / descent) -----
      if (
        current.altitudeMeters !== undefined &&
        previous.altitudeMeters !== undefined
      ) {
        const deltaAlt = current.altitudeMeters - previous.altitudeMeters;
        pitch = Cesium.Math.clamp(
          deltaAlt / 200,   // hassasiyet
          Cesium.Math.toRadians(-10),
          Cesium.Math.toRadians(10)
        );
      }

      // ----- ROLL (bank angle) -----
      if (
        current.headingDegrees !== undefined &&
        previous.headingDegrees !== undefined
      ) {
        let deltaHeading =
          current.headingDegrees - previous.headingDegrees;
        // wrap [-180, 180]
        if (deltaHeading > 180) deltaHeading -= 360;
        if (deltaHeading < -180) deltaHeading += 360;

        roll = Cesium.Math.clamp(
          // invert roll sign so bank direction matches visual expectation
          -Cesium.Math.toRadians(deltaHeading * 1.5),
          Cesium.Math.toRadians(-30),
          Cesium.Math.toRadians(30)
        );
      }
    }

    return new Cesium.HeadingPitchRoll(heading, pitch, roll);
  }

}
