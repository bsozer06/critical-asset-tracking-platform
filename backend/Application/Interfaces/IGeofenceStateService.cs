namespace CriticalAssetTracking.Application.Interfaces
{
    public interface IGeofenceStateService
    {
        // Returns the list of Geofence IDs that the Asset currently contains.
        Task<HashSet<Guid>> GetAssetCurrentGeofencesAsync(string assetId);

        // Updates the Geofence list containing the Asset
        Task UpdateAssetGeofencesAsync(string assetId, IEnumerable<Guid> geofenceIds);

        // Redis'te tüm geofence'leri sakla/oku
        Task<List<Domain.Entities.Geofence>> GetAllGeofencesAsync();
        Task SetAllGeofencesAsync(List<Domain.Entities.Geofence> geofences);
        Task AddOrUpdateGeofenceAsync(Domain.Entities.Geofence geofence);
        Task DeleteGeofenceAsync(Guid geofenceId);
    }
}
