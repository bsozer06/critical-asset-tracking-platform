namespace CriticalAssetSimulator;

public class AppConfig
{
    public SimulationConfig Simulation { get; set; } = new();
    public OutputConfig Output { get; set; } = new();
    public SecurityConfig Security { get; set; } = new();
}

public class SimulationConfig
{
    public int AssetCount { get; set; }
    public int UpdateIntervalMs { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double AltitudeMeters { get; set; }
    public double SpeedMetersPerSecond { get; set; }
    public double HeadingDegrees { get; set; }
}

public class OutputConfig
{
    public string Type { get; set; } = "console";
    public string? Host { get; set; }
    public int? Port { get; set; }
}

public class SecurityConfig
{
    public string Classification { get; set; } = "UNCLASSIFIED";
}
