import { inject, Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  GeoPoint, Geofence, GeofenceViolation, AssetGeofenceState 
} from '../models/geofence.model';
import { TelemetryPoint } from '../models/telemetry-point.model';

@Injectable({
  providedIn: 'root'
})
export class GeofenceService {
  private http = inject(HttpClient);

  // --- Signals (State) ---
  // API'den gelen ve dönüştürülen ana geofence listesi
  public geofences = signal<Geofence[]>([]);
  
  // İhlalleri tutan signal
  public violations = signal<GeofenceViolation[]>([]);

  // Assetlerin içeride/dışarıda olma durumlarını tutan Map (ID -> State)
  // Reaktiviteyi korumak için Map'in kendisini signal içinde tutuyoruz
  private assetStates = signal<Map<string, AssetGeofenceState>>(new Map());

  // Hızlı arama için ID'ye göre maplenmiş computed değer
  public geofenceMap = computed(() => {
    const map = new Map<string, Geofence>();
    this.geofences().forEach(g => map.set(g.id, g));
    return map;
  });

  constructor() {
    this.loadGeofencesFromApi().subscribe();
  }

  // --- API Methods ---

  loadGeofencesFromApi(): Observable<Geofence[]> {
    return this.http.get<Geofence[]>(environment.geofenceUrl).pipe(
      tap(data => {
        const transformed = data.map(g => this.transformGeofence(g));
        this.geofences.set(transformed);
      })
    );
  }

  saveGeofence(newGeofence: Partial<Geofence>): Observable<Geofence> {
    return this.http.post<Geofence>(environment.geofenceUrl, newGeofence).pipe(
      tap(saved => {
        const transformed = this.transformGeofence(saved);
        this.geofences.update(current => [...current, transformed]);
      })
    );
  }

  // --- Logic Methods ---

  /**
   * API'den gelen GeoJSON verisini dahili polygonPoints formatına çevirir
   */
  private transformGeofence(g: Geofence): Geofence {
    return {
      ...g,
      polygonPoints: g.boundary.coordinates[0].map(coord => ({
        longitude: coord[0],
        latitude: coord[1]
      }))
    };
  }

  /**
   * Telemetri verisine göre ihlal kontrolü yapar
   */
  checkGeofenceViolations(assetId: string, telemetry: TelemetryPoint): GeofenceViolation[] {
    const newViolations: GeofenceViolation[] = [];
    const currentPoint: GeoPoint = { 
      latitude: telemetry.latitude, 
      longitude: telemetry.longitude 
    };

    const currentGeofences = this.geofences().filter(g => g.isActive);

    currentGeofences.forEach(geofence => {
      const stateKey = `${assetId}_${geofence.id}`;
      const previousState = this.assetStates().get(stateKey);
      const wasInside = previousState?.isInside ?? false;

      // Algoritmayı polygonPoints üzerinden çalıştır
      const isCurrentlyInside = this.isPointInPolygon(currentPoint, geofence.polygonPoints || []);

      // State güncelleme (Signal update)
      if (wasInside !== isCurrentlyInside) {
        this.updateAssetState(stateKey, assetId, geofence.id, isCurrentlyInside, telemetry.timestampUtc);
        
        // Giriş/Çıkış tespiti
        if (!wasInside && isCurrentlyInside && geofence.alertOnEntry) {
          newViolations.push(this.createViolation(geofence.id, assetId, 'ENTRY', telemetry, currentPoint));
        } else if (wasInside && !isCurrentlyInside && geofence.alertOnExit) {
          newViolations.push(this.createViolation(geofence.id, assetId, 'EXIT', telemetry, currentPoint));
        }
      }
    });

    if (newViolations.length > 0) {
      this.violations.update(current => [...current, ...newViolations]);
    }

    return newViolations;
  }

  // --- Helper Methods ---

  private updateAssetState(key: string, assetId: string, geofenceId: string, isInside: boolean, time: string) {
    this.assetStates.update(map => {
      const newMap = new Map(map);
      newMap.set(key, { assetId, geofenceId, isInside, lastUpdate: new Date(time) });
      return newMap;
    });
  }

  private createViolation(gId: string, aId: string, type: "ENTRY" | "EXIT", tel: TelemetryPoint, loc: GeoPoint): GeofenceViolation {
    return {
      geofenceId: gId,
      assetId: aId,
      violationType: type,
      timestamp: new Date(tel.timestampUtc),
      location: loc
    };
  }

  isPointInPolygon(point: GeoPoint, polygon: GeoPoint[]): boolean {
    if (polygon.length < 3) return false;
    let inside = false;
    const x = point.longitude;
    const y = point.latitude;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].longitude, yi = polygon[i].latitude;
      const xj = polygon[j].longitude, yj = polygon[j].latitude;
      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }
}


// import { inject, Injectable, signal } from '@angular/core';
// import { GeoPoint, Geofence, GeofenceViolation, AssetGeofenceState } from '../models/geofence.model';
// import { TelemetryPoint } from '../models/telemetry-point.model';
// import { BehaviorSubject, Observable, tap } from 'rxjs';
// import { environment } from '../../environments/environment';
// import { HttpClient } from '@angular/common/http';

// @Injectable({
//   providedIn: 'root'
// })
// export class GeofenceService {
//   private http = inject(HttpClient);
//   private _geofences: Map<string, Geofence> = new Map();
//   private _assetStates: Map<string, Map<string, AssetGeofenceState>> = new Map();
//   private _violations: GeofenceViolation[] = [];

//   private _geofencesSubject = new BehaviorSubject<Geofence[]>([]);
//   public geofences$ = this._geofencesSubject.asObservable();

//   // State yönetimi için Signal kullanıyoruz (Angular 17, 18, 19+)
//   public geofences = signal<Geofence[]>([]);

//   constructor() {
//     this.loadGeofencesFromApi().subscribe();
//   }

//   /**
//    * Ray casting algorithm for point-in-polygon test
//    * Returns true if point is inside polygon, false otherwise
//    */
//   isPointInPolygon(point: GeoPoint, polygon: GeoPoint[]): boolean {
//     if (polygon.length < 3) {
//       return false;
//     }

//     let inside = false;
//     const x = point.longitude;
//     const y = point.latitude;

//     for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
//       const xi = polygon[i].longitude;
//       const yi = polygon[i].latitude;
//       const xj = polygon[j].longitude;
//       const yj = polygon[j].latitude;

//       const intersect = ((yi > y) !== (yj > y)) &&
//         (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

//       if (intersect) {
//         inside = !inside;
//       }
//     }

//     return inside;
//   }

//   /**
//    * Check if asset position violates any geofence
//    */
//   checkGeofenceViolations(assetId: string, telemetry: TelemetryPoint): GeofenceViolation[] {
//     const newViolations: GeofenceViolation[] = [];
//     const currentPoint: GeoPoint = {
//       latitude: telemetry.latitude,
//       longitude: telemetry.longitude
//     };

//     this._geofences.forEach((geofence: Geofence, geofenceId: string) => {
//       if (!geofence.enabled) {
//         return;
//       }

//       // Get previous state or initialize
//       if (!this._assetStates.has(assetId)) {
//         this._assetStates.set(assetId, new Map());
//       }

//       const assetStateMap = this._assetStates.get(assetId)!;
//       const previousState = assetStateMap.get(geofenceId);
//       const wasInside = previousState?.isInside ?? false;

//       // Check current position
//       const isCurrentlyInside = this.isPointInPolygon(currentPoint, geofence.polygon);

//       // Update state
//       const newState: AssetGeofenceState = {
//         assetId,
//         geofenceId,
//         isInside: isCurrentlyInside,
//         lastUpdate: new Date(telemetry.timestampUtc)
//       };
//       assetStateMap.set(geofenceId, newState);

//       // Detect violations
//       if (!wasInside && isCurrentlyInside && geofence.alertOnEntry) {
//         newViolations.push({
//           geofenceId,
//           assetId,
//           violationType: 'ENTRY',
//           timestamp: new Date(telemetry.timestampUtc),
//           location: currentPoint
//         });
//       } else if (wasInside && !isCurrentlyInside && geofence.alertOnExit) {
//         newViolations.push({
//           geofenceId,
//           assetId,
//           violationType: 'EXIT',
//           timestamp: new Date(telemetry.timestampUtc),
//           location: currentPoint
//         });
//       }
//     });

//     this._violations.push(...newViolations);
//     return newViolations;
//   }

//   /**
//    * Add or update a geofence
//    */
//   addGeofence(geofence: Geofence): void {
//     this._geofences.set(geofence.id, geofence);
//     this._refresh();
//   }

//   /**
//    * Remove a geofence
//    */
//   removeGeofence(geofenceId: string): void {
//     this._geofences.delete(geofenceId);
//     this._refresh();
//   }

//   /**
//    * Get all geofences
//    */
//   getGeofences(): Geofence[] {
//     return Array.from(this._geofences.values());
//   }


//   loadGeofencesFromApi(): Observable<Geofence[]> {
//     return this.http.get<Geofence[]>(environment.geofenceUrl).pipe(
//       tap(data => {
//         const transformed = data.map(g => ({
//           ...g,
//           polygonPoints: g.boundary.coordinates[0].map(coord => ({
//             longitude: coord[0],
//             latitude: coord[1]
//           }))
//         }));

//         this.geofences.set(transformed);
//       })
//     );
//   }

//   // Yeni Geofence ekleme (Kullanıcının çizdiği alan)
//   saveGeofence(newGeofence: Partial<Geofence>): Observable<Geofence> {
//     return this.http.post<Geofence>(environment.geofenceUrl, newGeofence).pipe(
//       tap(saved => {
//         // Mevcut listeye yeni ekleneni ekle
//         this.geofences.update(current => [...current, saved]);
//       })
//     );
//   }

//   /**
//    * Get geofence by ID
//    */
//   getGeofence(geofenceId: string): Geofence | undefined {
//     return this._geofences.get(geofenceId);
//   }

//   /**
//    * Get current state of an asset in all geofences
//    */
//   getAssetState(assetId: string): Map<string, AssetGeofenceState> | undefined {
//     return this._assetStates.get(assetId);
//   }

//   /**
//    * Get recent violations
//    */
//   getViolations(limit: number = 100): GeofenceViolation[] {
//     return this._violations.slice(-limit);
//   }

//   /**
//    * Clear violations
//    */
//   clearViolations(): void {
//     this._violations = [];
//   }

//   private _refresh(): void {
//     this._geofencesSubject.next(this.getGeofences());
//   }
// }
