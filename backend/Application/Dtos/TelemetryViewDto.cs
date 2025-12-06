namespace CriticalAssetTracking.Application.Dtos
{
    public record TelemetryViewDto(
        string AssetId,
        DateTime TimestampUtc,
        double Latitude,
        double Longitude,
        double AltitudeMeters,
        double SpeedMetersPerSecond,
        double HeadingDegrees
    );
}
