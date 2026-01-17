import * as Cesium from 'cesium';
import { TelemetryPoint } from "../models/telemetry-point.model";
import { CesiumUtility } from '../utilities/cesium.utility';
import { GeoPoint } from '../models/geofence.model';

// Creeate a helper class to manage Cesium-related utilities
export class CesiumHelper {

    public static computeLandVehicleOrientation(pt: TelemetryPoint): Cesium.Quaternion {
        const pos = CesiumUtility.toCartesian(pt);
        const heading = Cesium.Math.toRadians((pt.headingDegrees ?? 0) - 90);

        return Cesium.Transforms.headingPitchRollQuaternion(
            pos,
            new Cesium.HeadingPitchRoll(heading, 0, 0)
        );
    }

    public static computeOrientation(
        current: TelemetryPoint,
        previous?: TelemetryPoint
    ): Cesium.HeadingPitchRoll {

        const heading = Cesium.Math.toRadians((current.headingDegrees ?? 0) - 90);
        let pitch = 0;
        let roll = 0;

        if (previous) {
            if (
                current.altitudeMeters !== undefined &&
                previous.altitudeMeters !== undefined
            ) {
                pitch = Cesium.Math.clamp(
                    (current.altitudeMeters - previous.altitudeMeters) / 200,
                    Cesium.Math.toRadians(-10),
                    Cesium.Math.toRadians(10)
                );
            }

            if (
                current.headingDegrees !== undefined &&
                previous.headingDegrees !== undefined
            ) {
                let delta = current.headingDegrees - previous.headingDegrees;
                delta = ((delta + 180) % 360) - 180;

                roll = Cesium.Math.clamp(
                    -Cesium.Math.toRadians(delta * 1.5),
                    Cesium.Math.toRadians(-30),
                    Cesium.Math.toRadians(30)
                );
            }
        }

        return new Cesium.HeadingPitchRoll(heading, pitch, roll);
    }

    public static convertToGeoPoints(positions: Cesium.Cartesian3[]): GeoPoint[] {
        return positions.map(pos => {
            const cartographic = Cesium.Cartographic.fromCartesian(pos);
            return {
                latitude: Cesium.Math.toDegrees(cartographic.latitude),
                longitude: Cesium.Math.toDegrees(cartographic.longitude)
            };
        });

    }
}