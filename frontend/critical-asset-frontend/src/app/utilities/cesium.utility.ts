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
      Aircraft: 'assets/models/Cesium_Air.glb',
      Drone: 'assets/models/CesiumDrone.glb',
      LandVehicle: 'assets/models/GroundVehicle.glb',
      Ship: 'assets/models/Ship.glb'
    };
    return models[type ?? ''] ?? models['Aircraft'];
  }

   public static getTrailColor(type?: string): Cesium.Color {
    return type === 'LandVehicle'
      ? Cesium.Color.YELLOW.withAlpha(0.7)
      : Cesium.Color.CYAN.withAlpha(0.7);
  }
}