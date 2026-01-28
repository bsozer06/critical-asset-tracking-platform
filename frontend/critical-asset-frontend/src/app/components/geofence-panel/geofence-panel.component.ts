import { Component, inject, OnInit, effect, Signal } from '@angular/core';
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
  // Service Injection
  private _geofenceService = inject(GeofenceService);

  // UI State
  isDrawing: boolean = false;
  isPanelVisible: boolean = false;

  // Servisteki signal'e doğrudan referans veriyoruz (Reaktif bağ)
  // Template'de geofences() olarak çağırılacak
  public geofences: Signal<Geofence[]> = this._geofenceService.geofences;

  // Drawing Props
  private _handler: Cesium.ScreenSpaceEventHandler | null = null;
  private _tempPoints: Cesium.Cartesian3[] = [];
  private _floatingPoint: Cesium.Cartesian3 | null = null;
  private _activeShape: Cesium.Entity | null = null;

  constructor() {
    // Effect: Geofence listesi (Signal) her değiştiğinde haritayı otomatik güncelle
    effect(() => {
      const fences = this.geofences();
      this.renderAllGeofences(fences);
    });
  }

  togglePanel() {
    this.isPanelVisible = !this.isPanelVisible;
  }

  // --- Geofence İşlemleri ---

  toggleGeofenceEnabled(geofence: Geofence) {
    // Backend'de isActive olarak güncellenmesi için Partial nesne gönderiyoruz
    const updatePayload = { ...geofence, isActive: !geofence.isActive };
    this._geofenceService.saveGeofence(updatePayload).subscribe();
  }

  deleteGeofence(id: string) {
    // Servise delete metodu eklediğinde burayı bağla
    // this._geofenceService.removeGeofence(id);
    // Not: Signal update olduğu için harita effect üzerinden otomatik güncellenir
  }

  // --- Çizim Mantığı (Cesium) ---

  startNewDrawing(): void {
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

    // Sol Tık: Nokta Ekle
    this._handler.setInputAction((event: any) => {
      const earthPosition = viewer.scene.pickPosition(event.position);
      if (Cesium.defined(earthPosition)) {
        this._tempPoints.push(earthPosition);
        if (this._tempPoints.length === 1) {
          this._activeShape = this.createShape(this._tempPoints);
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // Mouse Hareket: Dinamik Çizgi
    this._handler.setInputAction((event: any) => {
      const newPosition = viewer.scene.pickPosition(event.endPosition);
      if (Cesium.defined(newPosition) && this._tempPoints.length > 0) {
        this._floatingPoint = newPosition;
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // Çift Tık: Bitir ve Kaydet
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

  saveGeofence() {
    if (this._tempPoints.length < 3) return;

    // Koordinat Dönüşümü (Cartesian -> Degree)
    const geoPoints: GeoPoint[] = this._tempPoints.map(cartesian => {
      const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
      return {
        longitude: Cesium.Math.toDegrees(cartographic.longitude),
        latitude: Cesium.Math.toDegrees(cartographic.latitude)
      };
    });

    // API Payload Hazırlama
    // Servisteki saveGeofence metodun boundary oluşturmayı zaten üstleniyor
    // const fencePayload: Partial<Geofence> = {
    //   name: `Zone ${this.geofences().length + 1}`,
    //   description: "User Defined Area",
    //   isActive: true,
    //   alertOnEntry: true,
    //   alertOnExit: true,
    //   boundary: {
    //     type: "Polygon",
    //     coordinates: [[ ...geoPoints.map(p => [p.longitude, p.latitude]), [geoPoints[0].longitude, geoPoints[0].latitude] ]]
    //   }
    // };
    const fencePayload = {
      name: `Zone ${this.geofences().length + 1}`,
      description: "User Defined Area",
      alertOnEntry: true,
      alertOnExit: true,
      // Backend'in beklediği: List<CoordinateDto> { Latitude, Longitude }
      coordinates: geoPoints.map(p => ({
        latitude: p.latitude,
        longitude: p.longitude
      }))
    };

    this._geofenceService.saveGeofence(fencePayload).subscribe({
      next: () => {
        this.terminateDrawing();
        this.isDrawing = false;
      },
      error: (err) => console.error('Save failed:', err)
    });
  }

  terminateDrawing() {
    const viewer = (window as any).viewer;
    this._handler?.destroy();
    this._handler = null;
    this._tempPoints = [];
    this._floatingPoint = null;
    if (this._activeShape) {
      viewer.entities.remove(this._activeShape);
      this._activeShape = null;
    }
  }

  // --- Render & Zoom ---

  renderAllGeofences(fences: Geofence[]) {
    const viewer = (window as any).viewer;
    if (!viewer) return;

    // Temizlik
    const entities = viewer.entities.values.filter((e: any) => e.properties && e.properties.isGeofence);
    entities.forEach((e: any) => viewer.entities.remove(e));

    // Çizim
    fences.forEach(fence => {
      const points = fence.polygonPoints || [];
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

  zoomToGeofence(fence: Geofence) {
    const viewer = (window as any).viewer;
    const entity = viewer.entities.getById(fence.id);
    if (entity) {
      viewer.zoomTo(entity, new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-90), 0));
    }
  }
}

// import { Component, inject, OnInit } from '@angular/core';
// import { Geofence, GeoPoint } from '../../models/geofence.model';
// import { GeofenceService } from '../../services/geofence.service';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { CdkDrag } from '@angular/cdk/drag-drop';
// import * as Cesium from 'cesium';

// @Component({
//   selector: 'app-geofence-panel',
//   standalone: true,
//   imports: [CommonModule, FormsModule, CdkDrag],
//   templateUrl: './geofence-panel.component.html',
//   styleUrl: './geofence-panel.component.css',
// })
// export class GeofencePanelComponent implements OnInit {
//   geofences: Geofence[] = [];
//   isDrawing: boolean = false;
//   isPanelVisible: boolean = false;

//   private _geofenceService = inject(GeofenceService)

//   private _handler: Cesium.ScreenSpaceEventHandler | null = null;
//   private _tempPoints: Cesium.Cartesian3[] = [];
//   private _floatingPoint: Cesium.Entity | null = null;
//   private _activeShapePoints: Cesium.Cartesian3[] = [];
//   private _activeShape: Cesium.Entity | null = null;

//   ngOnInit(): void {
//     this._geofenceService.geofences$.subscribe(fences => {
//       this.renderAllGeofences(fences);
//     });
//     this.loadGeofences();
//   }

//   togglePanel() {
//     this.isPanelVisible = !this.isPanelVisible;
//   }

//   loadGeofences() {
//     this.geofences = this._geofenceService.getGeofences();
//   }

//   toggleGeofenceEnabled(geofence: Geofence) {
//     geofence.enabled = !geofence.enabled;
//     this._geofenceService.addGeofence(geofence);
//   }

//   deleteGeofence(id: string) {
//     this._geofenceService.removeGeofence(id);
//     this.loadGeofences();
//     // TODO: Haritadan da silme event'i tetiklenecek
//   }

//   startNewDrawing() {
//     this.isDrawing = !this.isDrawing;

//     if (this.isDrawing) {
//       this.prepareDrawing();
//     } else {
//       this.terminateDrawing();
//     }
//   }

//   prepareDrawing() {
//     const viewer = (window as any).viewer;
//     this._handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);

//     // Add a point
//     this._handler.setInputAction((event: any) => {
//       const earthPosition = viewer.scene.pickPosition(event.position);
//       if (Cesium.defined(earthPosition)) {
//         this._tempPoints.push(earthPosition);
//         if (this._tempPoints.length === 1) {
//           this._activeShape = this.createShape(this._tempPoints);
//         }
//       }
//     }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

//     // Dynamic drawing
//     this._handler.setInputAction((event: any) => {
//       const newPosition = viewer.scene.pickPosition(event.endPosition);
//       if (Cesium.defined(newPosition) && this._tempPoints.length > 0) {
//         this._floatingPoint = newPosition;
//         // Cesium Callback Property sayesinde poligon otomatik güncellenecek
//       }
//     }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

//     // Finish drawing
//     this._handler.setInputAction(() => {
//       this.saveGeofence();
//       this.terminateDrawing();
//     }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
//   }

//   createShape(points: Cesium.Cartesian3[]) {
//     const viewer = (window as any).viewer;
//     return viewer.entities.add({
//       polygon: {
//         hierarchy: new Cesium.CallbackProperty(() => {
//           // Mevcut noktalar + mouse'un o anki konumu
//           const positions = this._floatingPoint
//             ? [...points, this._floatingPoint]
//             : points;
//           return new Cesium.PolygonHierarchy(positions as Cesium.Cartesian3[]);
//         }, false),
//         material: Cesium.Color.fromCssColorString('#64b5f6').withAlpha(0.3),
//         outline: true,
//         outlineColor: Cesium.Color.fromCssColorString('#64b5f6'),
//         heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
//       }
//     });
//   }

//   saveGeofence() {
//     if (this._tempPoints.length < 3) return;

//     const geoPoints: GeoPoint[] = this._tempPoints.map(cartesian => {
//       const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
//       return {
//         longitude: Cesium.Math.toDegrees(cartographic.longitude),
//         latitude: Cesium.Math.toDegrees(cartographic.latitude)
//       };
//     });

//     const fencePayload = {
//       name: `New Zone ${this._geofenceService.geofences().length + 1}`,
//       description: "Cesium üzerinden eklendi",
//       points: geoPoints // Servis bunu GeoJSON'a çevirecek
//     };

//     this._geofenceService.saveGeofence(fencePayload).subscribe({
//       next: (savedFence) => {
//         console.log('Veritabanına başarıyla kaydedildi:', savedFence);
//         this.terminateDrawing(); // Çizimi temizle
//       },
//       error: (err) => {
//         console.error('Kayıt sırasında hata oluştu:', err);
//         // Kullanıcıya hata mesajı gösterebilirsin
//       }
//     });

//     // const newFence: Geofence = {
//     //   id: Math.random().toString(36).substr(2, 9),
//     //   name: `New Zone ${this.geofences.length + 1}`,
//     //   polygon: geoPoints,
//     //   createdAt: new Date(),
//     //   enabled: true,
//     //   alertOnEntry: true,
//     //   alertOnExit: true
//     // };

//     // this._geofenceService.addGeofence(newFence);
//     // this.geofences = this._geofenceService.getGeofences();
//     this.geofences = this._geofenceService.geofences();
//   }

//   terminateDrawing() {
//     const viewer = (window as any).viewer;
//     this.isDrawing = false;
//     this._handler?.destroy();
//     this._handler = null;
//     this._tempPoints = [];
//     this._floatingPoint = null;
//     if (this._activeShape) {
//       viewer.entities.remove(this._activeShape);
//       this._activeShape = null;
//     }
//   }

//   renderAllGeofences(fences: Geofence[]) {
//     const viewer = (window as any).viewer;
//     if (!viewer) return;

//     // remove all entitites firstly
//     const geofenceEntities = viewer.entities.values.filter((e: any) => e.properties && e.properties.isGeofence);
//     geofenceEntities.forEach((e: any) => viewer.entities.remove(e));

//     // add all entitites on map
//     fences.forEach(fence => {
//       const points = fence.polygonPoints ||
//         fence.boundary.coordinates[0].map(c => ({ longitude: c[0], latitude: c[1] }));

//       if (!points || points.length < 3) return;
//       viewer.entities.add({
//         id: fence.id,
//         name: fence.name,
//         properties: { isGeofence: true },
//         polygon: {
//           hierarchy: Cesium.Cartesian3.fromDegreesArray(
//             points.flatMap(p => [p.longitude, p.latitude])),
//           material: fence.isActive
//             ? Cesium.Color.fromCssColorString('#64b5f6').withAlpha(0.3)
//             : Cesium.Color.GRAY.withAlpha(0.2),
//           outline: true,
//           outlineColor: Cesium.Color.fromCssColorString('#64b5f6'),
//           heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // Araziye yapıştır
//           classificationType: Cesium.ClassificationType.BOTH // Hem araziyi hem 3D modelleri boya
//         }
//       });
//     });
//   }

//   zoomToGeofence(fence: Geofence) {
//     const viewer = (window as any).viewer;
//     if (!viewer) return;

//     const entity = viewer.entities.getById(fence.id);

//     if (entity) {
//       viewer.zoomTo(entity, new Cesium.HeadingPitchRange(
//         Cesium.Math.toRadians(0),
//         Cesium.Math.toRadians(-45),
//         0
//       ));
//     } else {
//       const positions = Cesium.Cartesian3.fromDegreesArray(
//         fence.boundary.coordinates.flatMap(p => [p[0][0], p[0][1]])
//       );

//       const boundingSphere = Cesium.BoundingSphere.fromPoints(positions);
//       viewer.camera.flyToBoundingSphere(boundingSphere, {
//         duration: 1.5
//       });
//     }
//   }
// }
