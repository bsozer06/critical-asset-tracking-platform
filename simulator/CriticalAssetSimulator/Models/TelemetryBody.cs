using CriticalAssetSimulator.Enums;

namespace CriticalAssetSimulator.Models;

public record TelemetryBody
(
    DateTime TimestampUtc,
    double Latitude,
    double Longitude,
    double AltitudeMeters,
    double SpeedMetersPerSecond,
    double HeadingDegrees,
    AssetType AssetType
);