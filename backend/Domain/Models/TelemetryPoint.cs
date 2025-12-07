namespace CriticalAssetTracking.Domain.Models
{
    public record TelemetryPoint
     (
         string AssetId,
         double Latitude,
         double Longitude,
         double AltitudeMeters,
         double SpeedMps,
         double HeadingDeg,
         DateTime TimestampUtc,
         string Classification 
     );
}
