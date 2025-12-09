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

  constructor(private signalRService: SignalRService) { }

  ngAfterViewInit(): void {
    // configure baseUrl for static assets
    // (Cesium as any).buildModuleUrl.setBaseUrl(environment.cesiumBaseUrl);

    this.viewer = new Cesium.Viewer(this.cesiumContainer.nativeElement, {
      timeline: false,
      animation: false,
      baseLayerPicker: true,
      shadows: false,
      // terrainProvider: Cesium.createWorldTerrain ? Cesium.createWorldTerrain() : undefined
    });
    // this.viewer = new Cesium.Viewer(this.cesiumContainer.nativeElement);

    // // optionally set Ion token (if provided)
    // if (environment.cesiumIonToken) {
    //   Cesium.Ion.defaultAccessToken = environment.cesiumIonToken;
    // }

    // // subscribe to telemetry stream
    // this.subscription = this.signalRService.telemetry$.subscribe((pt) => {
    //   if (!pt) { return; }
    //   this.upsertEntity(pt);
    // });
  }

  upsertEntity(pt: TelemetryPoint) {
    if (!this.viewer) { return; }

    const id = pt.assetId;
    const existing = this.entitiesMap.get(id);
    const position = Cesium.Cartesian3.fromDegrees(pt.longitude, pt.latitude, pt.altitudeMeters ?? 0);

    if (existing) {
      existing.position = new Cesium.ConstantPositionProperty(position);
      // optionally update label
      if ((existing as any).billboard) {
        (existing as any).billboard.scale = 1.0;
      }
    } else {
      const entity = this.viewer.entities.add({
        id,
        position,
        billboard: {
          image: 'data:image/svg+xml;utf8,' + encodeURIComponent(this.svgForAsset(id)),
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          scale: 0.8
        },
        label: {
          text: id,
          font: '14px sans-serif',
          fillColor: Cesium.Color.WHITE,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 2,
          outlineColor: Cesium.Color.BLACK,
          pixelOffset: new Cesium.Cartesian2(0, -30)
        }
      });
      this.entitiesMap.set(id, entity);
    }
  }

  // simple SVG marker
  svgForAsset(id: string) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
      <circle cx="16" cy="12" r="8" fill="#ff0000" stroke="#000" stroke-width="1" />
      <text x="16" y="28" font-size="8" text-anchor="middle" fill="#fff">${id.replace(/[^0-9]/g, '')}</text>
    </svg>`;
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    if (this.viewer) {
      this.viewer.destroy();
    }
  }
}
