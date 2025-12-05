using System;
using System.Collections.Generic;

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

    public Simulator(int assetCount, AppConfig config)
    {
        _config = config;

        for (int i = 0; i < assetCount; i++)
        {
            _assets.Add(CreateRandomAsset(i + 1));
        }
    }
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

     private Asset CreateRandomAsset(int index)
    {
        return new Asset
        {
            AssetId = $"ASSET-{index:D3}",
            Latitude = _config.Simulation.Latitude + _random.NextDouble() * 0.05,
            Longitude = _config.Simulation.Longitude + _random.NextDouble() * 0.05,
            AltitudeMeters = _config.Simulation.AltitudeMeters + _random.NextDouble() * 5,
            SpeedMetersPerSecond = _config.Simulation.SpeedMetersPerSecond + _random.NextDouble() * 3,
            HeadingDegrees = _config.Simulation.HeadingDegrees + _random.NextDouble() * 360
        };
    }

}
