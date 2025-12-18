using CriticalAssetSimulator.Enums;

namespace CriticalAssetSimulator.Models;

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

    // Type of the asset (Aircraft, Drone, LandVehicle, *Person, *Ship)
    public AssetType Type { get; set; } = AssetType.Aircraft;

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
            HeadingDegrees,
            Type
        );
    }
}