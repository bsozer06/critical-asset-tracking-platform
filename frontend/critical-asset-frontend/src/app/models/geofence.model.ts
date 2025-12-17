export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface Geofence {
  id: string;
  name: string;
  polygon: GeoPoint[];
  createdAt: Date;
  enabled: boolean;
  alertOnEntry: boolean;
  alertOnExit: boolean;
}

export interface GeofenceViolation {
  geofenceId: string;
  assetId: string;
  violationType: 'ENTRY' | 'EXIT';
  timestamp: Date;
  location: GeoPoint;
}

export interface AssetGeofenceState {
  assetId: string;
  geofenceId: string;
  isInside: boolean;
  lastUpdate: Date;
}
