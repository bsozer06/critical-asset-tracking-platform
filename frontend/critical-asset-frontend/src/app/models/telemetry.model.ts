export interface Telemetry {
  assetId: string;
  timestampUtc: string; // ISO string
  latitude: number;
  longitude: number;
  altitudeMeters: number;
  speedMetersPerSecond: number;
  headingDegrees: number;
  classification?: string;
}