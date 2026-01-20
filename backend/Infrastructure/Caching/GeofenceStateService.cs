using CriticalAssetTracking.Application.Interfaces;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;

namespace CriticalAssetTracking.Infrastructure.Caching
{
    public class GeofenceStateService : IGeofenceStateService
    {
        private readonly IDistributedCache _cache;
        private const string KeyPrefix = "asset_state:";

        public GeofenceStateService(IDistributedCache cache)
        {
            _cache = cache;
        }

        public async Task<HashSet<Guid>> GetAssetCurrentGeofencesAsync(string assetId)
        {
            var key = $"{KeyPrefix}{assetId}";
            var cachedData = await _cache.GetStringAsync(key);

            if (string.IsNullOrEmpty(cachedData))
            {
                return new HashSet<Guid>();
            }

            // JSON olarak sakladığımız Guid listesini geri yüklüyoruz
            return JsonSerializer.Deserialize<HashSet<Guid>>(cachedData) ?? new HashSet<Guid>();
        }

        public async Task UpdateAssetGeofencesAsync(string assetId, IEnumerable<Guid> geofenceIds)
        {
            var key = $"{KeyPrefix}{assetId}";
            var dataToCache = JsonSerializer.Serialize(geofenceIds);

            var options = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(24)
            };

            await _cache.SetStringAsync(key, dataToCache, options);
        }
    }
}
