namespace CriticalAssetSimulator;

public class AppConfig
{
    public SimulationConfig Simulation { get; set; } = new();
    public OutputConfig Output { get; set; } = new();
    public SecurityConfig Security { get; set; } = new();
}

/// <summary>
/// Configuration settings for the asset simulation.
/// </summary>
public class SimulationConfig
{
    /// <summary>
    /// Gets or sets the number of assets to simulate.
    /// </summary>
    public int AssetCount { get; set; }

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
}

public class OutputConfig
{
    public string Type { get; set; } = "rabbitmq";
    public string? Host { get; set; }
    public int? Port { get; set; }
    public string? User { get; set; }
    public string? Password { get; set; }
    public string? Exchange { get; set; }
    public string? RoutingKey { get; set; }
}

public class SecurityConfig
{
    public string Classification { get; set; } = "UNCLASSIFIED";
}
