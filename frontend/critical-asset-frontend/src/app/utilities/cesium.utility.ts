import * as Cesium from 'cesium';
import { TelemetryPoint } from "../models/telemetry-point.model";
import { AssetType } from '../enums/asset-type.enum';

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

  public static getModelUri(type?: AssetType): string {
    const models: Record<AssetType, string> = {
      [AssetType.Aircraft]: 'assets/models/Cesium_Air.glb',
      [AssetType.Drone]: 'assets/models/CesiumDrone.glb',
      [AssetType.LandVehicle]: 'assets/models/GroundVehicle.glb',
      [AssetType.Ship]: 'assets/models/Ship.glb'
    };
    if (!type) {
      return '';
    }
    if (type in models) {
      return models[type];
    }
    return models[AssetType.Aircraft];
  }

  public static getTrailColor(type?: AssetType): Cesium.Color {
    if (!type) {
      return Cesium.Color.CYAN.withAlpha(0.7);
    }
    if (type === AssetType.LandVehicle) {
      return Cesium.Color.YELLOW.withAlpha(0.7);
    } else if (type === AssetType.Drone) {
      return Cesium.Color.ORANGE.withAlpha(0.7);
    } else {
      return Cesium.Color.CYAN.withAlpha(0.7);
    }
  }

  // Function to convert from string to enum
  public static parseAssetType(type?: string): AssetType | undefined {
    if (!type) return undefined;
    const normalized = type.charAt(0).toLowerCase() + type.slice(1);
    switch (normalized) {
      case AssetType.Aircraft:
        return AssetType.Aircraft;
      case AssetType.Drone:
        return AssetType.Drone;
      case AssetType.LandVehicle:
        return AssetType.LandVehicle;
      case AssetType.Ship:
        return AssetType.Ship;
      default:
        return undefined;
    }
  }

}