namespace CriticalAssetSimulator.Configs;


/// <summary>
/// Configuration settings for the asset simulation.
/// </summary>
public class SimulationConfig
{
    /// <summary>
    /// Gets or sets the number of assets to simulate.
    /// </summary>
    [Obsolete("Use AssetTypeCounts to configure assets by type. This property is kept for backward compatibility.")]
    public int AssetCount { get; set; }

    /// <summary>
    /// Gets or sets counts of assets grouped by asset type (e.g. { "Aircraft": 2, "LandVehicle": 3 }).
    /// When present, this is used in preference to AssetCount.
    /// </summary>
    public Dictionary<string, int>? AssetTypeCounts { get; set; }

    /// <summary>
    /// Gets or sets the interval, in milliseconds, between asset updates.
    /// </summary>
    public int UpdateIntervalMs { get; set; }

    /// <summary>
    /// Gets or sets the interval, in seconds, between generated points for each asset.
    /// </summary>
    public int PointIntervalSec { get; set; }

    /// <summary>
    /// Gets or sets the initial latitude for asset simulation.
    /// </summary>
    public double Latitude { get; set; }

    /// <summary>
    /// Gets or sets the initial longitude for asset simulation.
    /// </summary>
    public double Longitude { get; set; }

    /// <summary>
    /// Gets or sets the initial altitude, in meters, for asset simulation.
    /// </summary>
    public double AltitudeMeters { get; set; }

    /// <summary>
    /// Gets or sets the speed of the asset, in meters per second.
    /// </summary>
    public double SpeedMetersPerSecond { get; set; }

    /// <summary>
    /// Gets or sets the heading of the asset, in degrees.
    /// </summary>
    public double HeadingDegrees { get; set; }

    /// <summary>
    /// Optional default asset type to simulate (e.g. "Aircraft", "Drone", "LandVehicle").
    /// If not set, simulator will pick randomly.
    /// </summary>
    public string? DefaultAssetType { get; set; }

    /// <summary>
    /// Asset type-specific configurations (altitude, speed, etc.)
    /// </summary>
    public Dictionary<string, AssetTypeConfig>? AssetTypeDefaults { get; set; }
}
