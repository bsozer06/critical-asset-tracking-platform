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
    });
  }

  upsertEntity(pt: TelemetryPoint) {
    if (!this.viewer) { return; }

    const id = pt.assetId;
    const existing = this.entitiesMap.get(id);
    const position = Cesium.Cartesian3.fromDegrees(pt.longitude, pt.latitude, pt.altitudeMeters ?? 0);
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

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.trails.clear();
    this.entitiesMap.clear();
    this.lastTelemetry.clear();
    if (this.viewer) {
      this.viewer.destroy();
    }
  }

  addPlaneEntity(pt: TelemetryPoint, position: Cesium.Cartesian3, hpr: Cesium.HeadingPitchRoll, orientation: Cesium.Quaternion): Cesium.Entity | undefined {
    const id = pt.assetId;
    const entity = this.viewer?.entities.add({
      id: id,
      position,
      orientation,
      model: {
        uri: 'assets/models/Cesium_Air.glb',
        scale: 2.0, // modele göre ayarla
        minimumPixelSize: 64,
        maximumScale: 200,
        heightReference: Cesium.HeightReference.NONE
      },
      polyline: {
        positions: new Cesium.CallbackProperty(() => {
          return this.trails.get(id) ?? [];
        }, false),
        width: 2,
        material: Cesium.Color.CYAN.withAlpha(0.7)
      },
      label: {
        text: id,
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

  private computeOrientation(
    current: TelemetryPoint,
    previous?: TelemetryPoint
  ): Cesium.HeadingPitchRoll {

    const heading = Cesium.Math.toRadians(current.headingDeg ?? 0);

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
        current.headingDeg !== undefined &&
        previous.headingDeg !== undefined
      ) {
        let deltaHeading =
          current.headingDeg - previous.headingDeg;
        // wrap [-180, 180]
        if (deltaHeading > 180) deltaHeading -= 360;
        if (deltaHeading < -180) deltaHeading += 360;

        roll = Cesium.Math.clamp(
          Cesium.Math.toRadians(deltaHeading * 1.5),
          Cesium.Math.toRadians(-30),
          Cesium.Math.toRadians(30)
        );
      }
    }

    return new Cesium.HeadingPitchRoll(heading, pitch, roll);
  }

}
