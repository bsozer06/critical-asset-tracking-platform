using CriticalAssetTracking.Application.Interfaces;
using CriticalAssetTracking.Domain.Models;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;

namespace CriticalAssetTracking.Infrastructure.Caching
{
    public class GeofenceStateService : IGeofenceStateService
    {
        private static readonly NetTopologySuite.IO.WKTReader _wktReader = new NetTopologySuite.IO.WKTReader();
        private static readonly NetTopologySuite.IO.WKTWriter _wktWriter = new NetTopologySuite.IO.WKTWriter();
    
        private readonly IDistributedCache _cache;
        private const string KeyPrefix = "asset_state:";
        private const string GeofenceListKey = "geofence_list";

        public GeofenceStateService(IDistributedCache cache)
        {
            _cache = cache;
        }
        // Redis'te tüm geofence'leri sakla/oku

        public async Task<List<Domain.Entities.Geofence>> GetAllGeofencesAsync()
        {
            var geofencesJson = await _cache.GetStringAsync(GeofenceListKey);
            if (string.IsNullOrEmpty(geofencesJson))
                return new List<Domain.Entities.Geofence>();
            var cacheList = JsonSerializer.Deserialize<List<GeofenceCacheDto>>(geofencesJson, _jsonOptions) ?? new List<GeofenceCacheDto>();
            // WKT'den geometry'ye dönüştür
            return cacheList.Select(dto => new Domain.Entities.Geofence
            {
                Id = dto.Id,
                Name = dto.Name,
                Description = dto.Description,
                Boundary = string.IsNullOrEmpty(dto.BoundaryWkt) ? null : _wktReader.Read(dto.BoundaryWkt),
                AlertOnEntry = dto.AlertOnEntry,
                AlertOnExit = dto.AlertOnExit,
                IsActive = dto.IsActive,
                CreatedAtUtc = dto.CreatedAtUtc
            }).ToList();
        }

        public async Task SetAllGeofencesAsync(List<Domain.Entities.Geofence> geofences)
        {
            // Geometry'yi WKT'ye çevirerek sakla
            var cacheList = geofences.Select(g => new GeofenceCacheDto
            {
                Id = g.Id,
                Name = g.Name,
                Description = g.Description,
                BoundaryWkt = g.Boundary != null ? _wktWriter.Write(g.Boundary) : string.Empty,
                AlertOnEntry = g.AlertOnEntry,
                AlertOnExit = g.AlertOnExit,
                IsActive = g.IsActive,
                CreatedAtUtc = g.CreatedAtUtc
            }).ToList();
            var geofencesJson = JsonSerializer.Serialize(cacheList, _jsonOptions);
            var options = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(24)
            };
            await _cache.SetStringAsync(GeofenceListKey, geofencesJson, options);
        }


        public async Task AddOrUpdateGeofenceAsync(Domain.Entities.Geofence geofence)
        {
            var geofences = await GetAllGeofencesAsync();
            var idx = geofences.FindIndex(g => g.Id == geofence.Id);
            if (idx >= 0)
                geofences[idx] = geofence;
            else
                geofences.Add(geofence);
            await SetAllGeofencesAsync(geofences);
        }

        public async Task DeleteGeofenceAsync(Guid geofenceId)
        {
            var geofences = await GetAllGeofencesAsync();
            geofences.RemoveAll(g => g.Id == geofenceId);
            await SetAllGeofencesAsync(geofences);
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

        // Ortak serializer options
        private static readonly JsonSerializerOptions _jsonOptions = new JsonSerializerOptions
        {
            NumberHandling = System.Text.Json.Serialization.JsonNumberHandling.AllowNamedFloatingPointLiterals
        };

    
    }
}
