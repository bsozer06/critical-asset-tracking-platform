using System;
using System.Text;
using System.Text.Json;

namespace CriticalAssetSimulator;

/// <summary>
/// Security / classification level (MVP version)
/// </summary>
public enum ClassificationLevel
{
    UNCLASSIFIED,
    RESTRICTED,
    CONFIDENTIAL
}

/// <summary>
/// Builds a military-style telemetry message envelope
/// </summary>
public static class TelemetryMessage
{
    private const string ProtocolVersion = "CATP/1.0"; // Critical Asset Tracking Protocol (MVP)

    public static string Build(
        TelemetryPoint point,
        ClassificationLevel classification = ClassificationLevel.UNCLASSIFIED)
    {
        var message = new
        {
            header = new
            {
                protocol = ProtocolVersion,
                messageType = "telemetry",
                assetId = point.AssetId,
                timestampUtc = point.TimestampUtc.ToString("O"),
                classification = classification.ToString()
            },
            body = new
            {
                latitude = point.Latitude,
                longitude = point.Longitude,
                altitudeMeters = point.AltitudeMeters,
                speedMps = point.SpeedMetersPerSecond,
                headingDeg = point.HeadingDegrees
            }
        };

        string json = JsonSerializer.Serialize(message);
        string checksum = ComputeChecksum(json);

        var envelope = new
        {
            message,
            integrity = new
            {
                checksum
            }
        };

        return JsonSerializer.Serialize(envelope);
    }

    private static string ComputeChecksum(string input)
    {
        var bytes = Encoding.UTF8.GetBytes(input);
        var crc = new System.IO.Hashing.Crc32();
        crc.Append(bytes);
        return BitConverter
            .ToString(crc.GetCurrentHash())
            .Replace("-", "");
    }
}