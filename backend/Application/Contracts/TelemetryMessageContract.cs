using System.Text.Json.Serialization;

namespace CriticalAssetTracking.Application.Contracts
{
    /// <summary>
    /// Contract used on RabbitMQ (MVP): JSON-serialized.
    /// Keep simple and stable for simulator compatibility.
    /// </summary>
    public record TelemetryMessageContract(
        [property: JsonPropertyName("assetId")] string AssetId,
        [property: JsonPropertyName("timestampUtc")] DateTime TimestampUtc,
        [property: JsonPropertyName("latitude")] double Latitude,
        [property: JsonPropertyName("longitude")] double Longitude,
        [property: JsonPropertyName("altitudeMeters")] double AltitudeMeters,
        [property: JsonPropertyName("speedMps")] double SpeedMetersPerSecond,
        [property: JsonPropertyName("headingDeg")] double HeadingDegrees,
        [property: JsonPropertyName("checksum")] string? Checksum = null // optional MVP
    );
}
