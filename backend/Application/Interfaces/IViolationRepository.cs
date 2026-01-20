using CriticalAssetTracking.Domain.Entities;

namespace CriticalAssetTracking.Application.Interfaces
{
    public interface IViolationRepository
    {
        Task AddAsync(GeofenceViolation violation);
        Task<List<GeofenceViolation>> GetHistoryByAssetIdAsync(string assetId, int limit = 100);
    }

}
