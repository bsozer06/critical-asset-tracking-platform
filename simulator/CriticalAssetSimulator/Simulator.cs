using CriticalAssetSimulator.Configs;
using CriticalAssetSimulator.Enums;
using CriticalAssetSimulator.Models;

namespace CriticalAssetSimulator;

/// <summary>
/// Core asset movement simulator.
/// Each Step() advances the simulation and produces telemetry points.
/// </summary>
    public class Simulator
{
    private readonly List<Asset> _assets = new();
    private readonly Random _random = new();
    private readonly AppConfig _config;

    public Simulator(AppConfig config)
    {
        _config = config;

        // If asset counts by type present, create those; otherwise fall back to legacy AssetCount.
        if (_config.Simulation.AssetTypeCounts != null && _config.Simulation.AssetTypeCounts.Count > 0)
        {
            int index = 1;
            foreach (var kvp in _config.Simulation.AssetTypeCounts)
            {
                var typeName = kvp.Key;
                var count = kvp.Value;
                if (!Enum.TryParse<AssetType>(typeName, true, out var parsedType))
                {
                    // unknown type -> default to Aircraft
                    parsedType = AssetType.Aircraft;
                }

                for (int i = 0; i < count; i++)
                {
                    var a = CreateRandomAsset(index++ , parsedType);
                    _assets.Add(a);
                }
            }
        }
        else
        {
            var assetCount = _config.Simulation.AssetCount;
            for (int i = 0; i < assetCount; i++)
            {
                _assets.Add(CreateRandomAsset(i + 1));
            }
        }
    }

    // expose assets for diagnostics and frontend/dev use
    public IReadOnlyList<Asset> Assets => _assets.AsReadOnly();
    
    /// <summary>
    /// Advances the simulation by the given time delta
    /// and returns telemetry points for all assets.
    /// </summary>
    public IEnumerable<TelemetryPoint> Step(int deltaTimeMs)
    {
        var telemetry = new List<TelemetryPoint>();

        foreach (var asset in _assets)
        {
            asset.Move(deltaTimeMs);
            telemetry.Add(asset.CreateTelemetry());
        }

        return telemetry;
    }

    private Asset CreateRandomAsset(int index, AssetType? forcedType = null)
    {
        // determine asset type: forcedType > config default > random
        AssetType type;
        if (forcedType.HasValue)
        {
            type = forcedType.Value;
        }
        else if (!string.IsNullOrWhiteSpace(_config.Simulation.DefaultAssetType) &&
            Enum.TryParse<AssetType>(_config.Simulation.DefaultAssetType, true, out var parsed))
        {
            type = parsed;
        }
        else
        {
            // pick a random type from enum
            var values = Enum.GetValues<AssetType>();
            type = values[_random.Next(values.Length)];
        }

        // Get asset-type-specific config if available, otherwise use simulation defaults
        var typeConfig = GetAssetTypeConfig(type);
        double altitude = type == AssetType.LandVehicle
            ? 0
            : typeConfig.AltitudeMeters + _random.NextDouble() * 5;
        double speed = typeConfig.SpeedMetersPerSecond + _random.NextDouble() * 3;
        double baseHeading = typeConfig.HeadingDegrees;

        // ensure heading is normalized to [0,360)
        var rawHeading = baseHeading + _random.NextDouble() * 360.0;
        var heading = ((rawHeading % 360.0) + 360.0) % 360.0;

        return new Asset
        {
            AssetId = $"ASSET-{index:D3}",
            Latitude = _config.Simulation.Latitude + _random.NextDouble() * 0.05,
            Longitude = _config.Simulation.Longitude + _random.NextDouble() * 0.05,
            AltitudeMeters = altitude,
            SpeedMetersPerSecond = speed,
            HeadingDegrees = heading,
            Type = type
        };
    }

    private AssetTypeDefaults GetAssetTypeConfig(AssetType type)
    {
        var typeName = type.ToString();
        
        if (_config.Simulation.AssetTypeDefaults != null &&
            _config.Simulation.AssetTypeDefaults.TryGetValue(typeName, out var config))
        {
            return new AssetTypeDefaults
            {
                AltitudeMeters = config.AltitudeMeters ?? _config.Simulation.AltitudeMeters,
                SpeedMetersPerSecond = config.SpeedMetersPerSecond ?? _config.Simulation.SpeedMetersPerSecond,
                HeadingDegrees = config.HeadingDegrees ?? _config.Simulation.HeadingDegrees
            };
        }
        
        return new AssetTypeDefaults
        {
            AltitudeMeters = _config.Simulation.AltitudeMeters,
            SpeedMetersPerSecond = _config.Simulation.SpeedMetersPerSecond,
            HeadingDegrees = _config.Simulation.HeadingDegrees
        };
    }
}

/// <summary>
/// Helper class for asset type defaults
/// </summary>
internal class AssetTypeDefaults
{
    public double AltitudeMeters { get; set; }
    public double SpeedMetersPerSecond { get; set; }
    public double HeadingDegrees { get; set; }
}
