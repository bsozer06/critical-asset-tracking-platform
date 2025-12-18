namespace CriticalAssetSimulator.Configs;

/// <summary>
/// Configuration settings specific to an asset type.
/// </summary>
public class AssetTypeConfig
{
    /// <summary>
    /// Initial altitude in meters for this asset type.
    /// </summary>
    public double? AltitudeMeters { get; set; }

    /// <summary>
    /// Speed in meters per second for this asset type.
    /// </summary>
    public double? SpeedMetersPerSecond { get; set; }

    /// <summary>
    /// Initial heading in degrees for this asset type.
    /// </summary>
    public double? HeadingDegrees { get; set; }
}
