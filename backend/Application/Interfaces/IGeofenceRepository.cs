using CriticalAssetTracking.Domain.Entities;
using NetTopologySuite.Geometries;

namespace CriticalAssetTracking.Application.Interfaces
{
    public interface IGeofenceRepository
    {
        Task<List<Geofence>> GetIntersectingGeofencesAsync(Point point);
        Task AddAsync(Geofence geofence);
        Task<Geofence> GetByIdAsync(Guid id);
        Task<List<Geofence>> GetAllAsync();
        Task DeleteAsync(Guid id);
    }
}
