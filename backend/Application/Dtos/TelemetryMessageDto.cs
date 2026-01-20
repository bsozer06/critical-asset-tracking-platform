namespace CriticalAssetTracking.Application.Dtos
{
    public record TelemetryMessageDto(
        string AssetId,
        double Latitude,
        double Longitude,
        DateTime TimestampUtc
    );
}



