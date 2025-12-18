using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using CriticalAssetSimulator.Enums;
using CriticalAssetSimulator.Models;

namespace CriticalAssetSimulator.Helpers;

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
        var jsonOptions = new JsonSerializerOptions
        {
            Converters = { new JsonStringEnumConverter() }
        };
        var body = new TelemetryBody(
                point.TimestampUtc,
                point.Latitude,
                point.Longitude,
                point.AltitudeMeters,
                point.SpeedMetersPerSecond,
                point.HeadingDegrees,
                point.AssetType
        );

        var message = new
        {
            header = new
            {
                protocol = ProtocolVersion,
                messageType = "telemetry",
                assetId = point.AssetId,
                timestampUtc = point.TimestampUtc.ToString("O"),
                classification = classification.ToString(),
                assetType = point.AssetType
            },
            body
        };

        string json = JsonSerializer.Serialize(message, jsonOptions);
        string checksum = ComputeChecksum(json);

        var envelope = new
        {
            message,
            integrity = new
            {
                checksum
            }
        };

        return JsonSerializer.Serialize(envelope, jsonOptions);
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