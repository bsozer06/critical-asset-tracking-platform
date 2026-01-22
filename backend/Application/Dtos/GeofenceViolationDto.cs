namespace CriticalAssetTracking.Application.Dtos
{
    public record GeofenceViolationDto(
        string AssetId,
        Guid GeofenceId,
        string ViolationType,
        DateTime TimestampUtc
    );
}
