import { inject, Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, retry, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  GeoPoint, Geofence, GeofenceViolation, AssetGeofenceState 
} from '../models/geofence.model';
import { TelemetryPoint } from '../models/telemetry-point.model';

@Injectable({
  providedIn: 'root'
})
export class GeofenceService {
  private _http = inject(HttpClient);

  // --- Signals (State) ---
  // API'den gelen ve dönüştürülen ana geofence listesi
  public geofences = signal<Geofence[]>([]);
  
  // İhlalleri tutan signal
  public violations = signal<GeofenceViolation[]>([]);

  // Assetlerin içeride/dışarıda olma durumlarını tutan Map (ID -> State)
  // Reaktiviteyi korumak için Map'in kendisini signal içinde tutuyoruz
  private _assetStates = signal<Map<string, AssetGeofenceState>>(new Map());

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
    return this._http.get<Geofence[]>(environment.geofenceUrl).pipe(
      retry({ count: 3, delay: 3000 }),
      tap(data => {
        const transformed = data.map(g => this._transformGeofence(g));
        this.geofences.set(transformed);
      })
    );
  }

  saveGeofence(newGeofence: Partial<Geofence>): Observable<Geofence> {
    return this._http.post<Geofence>(environment.geofenceUrl, newGeofence).pipe(
      tap(saved => {
        const transformed = this._transformGeofence(saved);
        this.geofences.update(current => [...current, transformed]);
      })
    );
  }

  // --- Logic Methods ---

  /**
   * API'den gelen GeoJSON verisini dahili polygonPoints formatına çevirir
   */
  private _transformGeofence(g: Geofence): Geofence {
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
      const previousState = this._assetStates().get(stateKey);
      const wasInside = previousState?.isInside ?? false;

      // Algoritmayı polygonPoints üzerinden çalıştır
      const isCurrentlyInside = this.isPointInPolygon(currentPoint, geofence.polygonPoints || []);

      // State güncelleme (Signal update)
      if (wasInside !== isCurrentlyInside) {
        this._updateAssetState(stateKey, assetId, geofence.id, isCurrentlyInside, telemetry.timestampUtc);
        
        // Giriş/Çıkış tespiti
        if (!wasInside && isCurrentlyInside && geofence.alertOnEntry) {
          newViolations.push(this._createViolation(geofence.id, assetId, 'ENTRY', telemetry, currentPoint));
        } else if (wasInside && !isCurrentlyInside && geofence.alertOnExit) {
          newViolations.push(this._createViolation(geofence.id, assetId, 'EXIT', telemetry, currentPoint));
        }
      }
    });

    if (newViolations.length > 0) {
      this.violations.update(current => [...current, ...newViolations]);
    }

    return newViolations;
  }

  // --- Helper Methods ---

  private _updateAssetState(key: string, assetId: string, geofenceId: string, isInside: boolean, time: string) {
    this._assetStates.update(map => {
      const newMap = new Map(map);
      newMap.set(key, { assetId, geofenceId, isInside, lastUpdate: new Date(time) });
      return newMap;
    });
  }

  private _createViolation(gId: string, aId: string, type: "ENTRY" | "EXIT", tel: TelemetryPoint, loc: GeoPoint): GeofenceViolation {
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