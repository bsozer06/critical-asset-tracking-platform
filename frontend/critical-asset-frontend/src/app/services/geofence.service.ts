import { Injectable } from '@angular/core';
import { GeoPoint, Geofence, GeofenceViolation, AssetGeofenceState } from '../models/geofence.model';
import { TelemetryPoint } from '../models/telemetry-point.model';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GeofenceService {
  private _geofences: Map<string, Geofence> = new Map();
  private _assetStates: Map<string, Map<string, AssetGeofenceState>> = new Map();
  private _violations: GeofenceViolation[] = [];

  private geofencesSubject = new BehaviorSubject<Geofence[]>([]);
  public geofences$ = this.geofencesSubject.asObservable();
  
  constructor() {}

  /**
   * Ray casting algorithm for point-in-polygon test
   * Returns true if point is inside polygon, false otherwise
   */
  isPointInPolygon(point: GeoPoint, polygon: GeoPoint[]): boolean {
    if (polygon.length < 3) {
      return false;
    }

    let inside = false;
    const x = point.longitude;
    const y = point.latitude;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].longitude;
      const yi = polygon[i].latitude;
      const xj = polygon[j].longitude;
      const yj = polygon[j].latitude;

      const intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

      if (intersect) {
        inside = !inside;
      }
    }

    return inside;
  }

  /**
   * Check if asset position violates any geofence
   */
  checkGeofenceViolations(assetId: string, telemetry: TelemetryPoint): GeofenceViolation[] {
    const newViolations: GeofenceViolation[] = [];
    const currentPoint: GeoPoint = {
      latitude: telemetry.latitude,
      longitude: telemetry.longitude
    };

    this._geofences.forEach((geofence: Geofence, geofenceId: string) => {
      if (!geofence.enabled) {
        return;
      }

      // Get previous state or initialize
      if (!this._assetStates.has(assetId)) {
        this._assetStates.set(assetId, new Map());
      }

      const assetStateMap = this._assetStates.get(assetId)!;
      const previousState = assetStateMap.get(geofenceId);
      const wasInside = previousState?.isInside ?? false;

      // Check current position
      const isCurrentlyInside = this.isPointInPolygon(currentPoint, geofence.polygon);

      // Update state
      const newState: AssetGeofenceState = {
        assetId,
        geofenceId,
        isInside: isCurrentlyInside,
        lastUpdate: new Date(telemetry.timestampUtc)
      };
      assetStateMap.set(geofenceId, newState);

      // Detect violations
      if (!wasInside && isCurrentlyInside && geofence.alertOnEntry) {
        newViolations.push({
          geofenceId,
          assetId,
          violationType: 'ENTRY',
          timestamp: new Date(telemetry.timestampUtc),
          location: currentPoint
        });
      } else if (wasInside && !isCurrentlyInside && geofence.alertOnExit) {
        newViolations.push({
          geofenceId,
          assetId,
          violationType: 'EXIT',
          timestamp: new Date(telemetry.timestampUtc),
          location: currentPoint
        });
      }
    });

    this._violations.push(...newViolations);
    return newViolations;
  }

  /**
   * Add or update a geofence
   */
  addGeofence(geofence: Geofence): void {
    this._geofences.set(geofence.id, geofence);
    this.refresh();
  }

  /**
   * Remove a geofence
   */
  removeGeofence(geofenceId: string): void {
    this._geofences.delete(geofenceId);
    this.refresh();
  }

  /**
   * Get all geofences
   */
  getGeofences(): Geofence[] {
    return Array.from(this._geofences.values());
  }

  /**
   * Get geofence by ID
   */
  getGeofence(geofenceId: string): Geofence | undefined {
    return this._geofences.get(geofenceId);
  }

  /**
   * Get current state of an asset in all geofences
   */
  getAssetState(assetId: string): Map<string, AssetGeofenceState> | undefined {
    return this._assetStates.get(assetId);
  }

  /**
   * Get recent violations
   */
  getViolations(limit: number = 100): GeofenceViolation[] {
    return this._violations.slice(-limit);
  }

  /**
   * Clear violations
   */
  clearViolations(): void {
    this._violations = [];
  }

  private refresh(): void {
    this.geofencesSubject.next(this.getGeofences());
  }
}
