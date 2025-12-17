import { Injectable } from '@angular/core';
import { GeoPoint, Geofence, GeofenceViolation, AssetGeofenceState } from '../models/geofence.model';
import { TelemetryPoint } from '../models/telemetry-point.model';

@Injectable({
  providedIn: 'root'
})
export class GeofenceService {
  private geofences: Map<string, Geofence> = new Map();
  private assetStates: Map<string, Map<string, AssetGeofenceState>> = new Map();
  private violations: GeofenceViolation[] = [];

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

    this.geofences.forEach((geofence, geofenceId) => {
      if (!geofence.enabled) {
        return;
      }

      // Get previous state or initialize
      if (!this.assetStates.has(assetId)) {
        this.assetStates.set(assetId, new Map());
      }

      const assetStateMap = this.assetStates.get(assetId)!;
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

    this.violations.push(...newViolations);
    return newViolations;
  }

  /**
   * Add or update a geofence
   */
  addGeofence(geofence: Geofence): void {
    this.geofences.set(geofence.id, geofence);
  }

  /**
   * Remove a geofence
   */
  removeGeofence(geofenceId: string): void {
    this.geofences.delete(geofenceId);
  }

  /**
   * Get all geofences
   */
  getGeofences(): Geofence[] {
    return Array.from(this.geofences.values());
  }

  /**
   * Get geofence by ID
   */
  getGeofence(geofenceId: string): Geofence | undefined {
    return this.geofences.get(geofenceId);
  }

  /**
   * Get current state of an asset in all geofences
   */
  getAssetState(assetId: string): Map<string, AssetGeofenceState> | undefined {
    return this.assetStates.get(assetId);
  }

  /**
   * Get recent violations
   */
  getViolations(limit: number = 100): GeofenceViolation[] {
    return this.violations.slice(-limit);
  }

  /**
   * Clear violations
   */
  clearViolations(): void {
    this.violations = [];
  }
}
