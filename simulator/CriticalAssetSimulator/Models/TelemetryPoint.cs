using CriticalAssetSimulator.Enums;

namespace CriticalAssetSimulator.Models;

/// <summary>
/// Immutable telemetry point sent to the tracking platform
/// </summary>
public record TelemetryPoint
(
    string AssetId,
    DateTime TimestampUtc,
    double Latitude,
    double Longitude,
    double AltitudeMeters,
    double SpeedMetersPerSecond,
    double HeadingDegrees,
    AssetType AssetType
);