using System;

namespace CriticalAssetSimulator;
// Notes: 
// Asset → mutable
// - Represents a live object in the simulation
// - Position and speed change over time

// TelemetryPoint → immutable
// - Represents a historical measurement
// - Once emitted, it must never change
// - Perfect for streaming & messaging systems


/// <summary>
/// Represents a real-world tracked asset
/// (vehicle, personnel, drone, etc.)
/// </summary>
public class Asset
{
    public string AssetId { get; set; } = string.Empty;

    // Geographic position (WGS84)
    public double Latitude { get; set; }
    public double Longitude { get; set; }

    // Altitude in meters
    public double AltitudeMeters { get; set; }

    // Movement properties
    public double SpeedMetersPerSecond { get; set; }
    public double HeadingDegrees { get; set; }

    public void Move(int deltaMs)
    {
        double distance = SpeedMetersPerSecond * (deltaMs / 1000.0);
        double rad = HeadingDegrees * Math.PI / 180.0;

        Latitude += Math.Cos(rad) * distance * 0.00001;
        Longitude += Math.Sin(rad) * distance * 0.00001;
    }

    
    public TelemetryPoint CreateTelemetry()
    {
        return new TelemetryPoint(
            AssetId,
            DateTime.UtcNow,
            Latitude,
            Longitude,
            AltitudeMeters,
            SpeedMetersPerSecond,
            HeadingDegrees
        );
    }
}

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
    double HeadingDegrees
);
