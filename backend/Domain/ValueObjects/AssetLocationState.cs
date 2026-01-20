namespace CriticalAssetTracking.Domain.ValueObjects
{
    public record AssetLocationState(string AssetId, Guid GeofenceId, bool IsInside, DateTime LastUpdate);
}
