export interface TelemetryPoint {
  assetId: string;
  timestampUtc: string; // ISO string
  latitude: number;
  longitude: number;
  altitudeMeters?: number;
  speedMps?: number;
  headingDeg?: number;
  classification?: string;
}
