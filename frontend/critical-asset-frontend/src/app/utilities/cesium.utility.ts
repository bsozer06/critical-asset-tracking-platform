import * as Cesium from 'cesium';
import { TelemetryPoint } from "../models/telemetry-point.model";

// Create a helper class to manage Cesium-related utilities
export class CesiumUtility {

  // Convert latitude, longitude, altitude to Cesium Cartesian3
  public static toCartesian(pt: TelemetryPoint): Cesium.Cartesian3 {
    return Cesium.Cartesian3.fromDegrees(
      pt.longitude,
      pt.latitude,
      pt.altitudeMeters ?? 0
    );
  }

  public static getModelUri(type?: string): string {
    const models: Record<string, string> = {
      aircraft: 'assets/models/Cesium_Air.glb',
      drone: 'assets/models/CesiumDrone.glb',
      landVehicle: 'assets/models/GroundVehicle.glb',
      ship: 'assets/models/Ship.glb'
    };
    return models[type ?? ''] ?? models['aircraft'];
  }

   public static getTrailColor(type?: string): Cesium.Color {
    if (type === 'landVehicle') {
      return Cesium.Color.YELLOW.withAlpha(0.7);
    } else if (type === 'drone') {
      return Cesium.Color.ORANGE.withAlpha(0.7);
    } else {
      return Cesium.Color.CYAN.withAlpha(0.7);
    }
  }
}