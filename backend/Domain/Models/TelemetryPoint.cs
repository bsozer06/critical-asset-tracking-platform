namespace CriticalAssetTracking.Domain.Models
{
    public record TelemetryPoint
     (
         string AssetId,
         double Latitude,
         double Longitude,
         double AltitudeMeters,
         double SpeedMetersPerSecond,
         double HeadingDegrees,
         DateTime TimestampUtc,
         string Classification,
         string AssetType = ""
     );
}
