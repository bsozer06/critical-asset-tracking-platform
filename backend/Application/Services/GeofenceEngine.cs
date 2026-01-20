using CriticalAssetTracking.Application.Contracts;
using CriticalAssetTracking.Application.Dtos;
using CriticalAssetTracking.Application.Interfaces;
using CriticalAssetTracking.Domain.Entities;
using NetTopologySuite.Geometries;

namespace CriticalAssetTracking.Application.Services
{
    public class GeofenceEngine
    {
        private readonly IGeofenceRepository _geofenceRepository;
        private readonly IGeofenceStateService _stateService;
        private readonly IViolationRepository _violationRepository;
        private readonly GeometryFactory _geometryFactory;

        public GeofenceEngine(
            IGeofenceRepository geofenceRepository,
            IGeofenceStateService stateService,
            IViolationRepository violationRepository)
        {
            _geofenceRepository = geofenceRepository;
            _stateService = stateService;
            _violationRepository = violationRepository;

            _geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
        }

        public async Task ProcessTelemetryAsync(TelemetryMessageDto telemetry)
        {
            var currentPoint = _geometryFactory.CreatePoint(new Coordinate(telemetry.Longitude, telemetry.Latitude));

            // 2. PostGIS üzerinden "bu nokta şu an hangi poligonların içinde?" sorgusu (Infrastructure)
            var currentlyInsideGeofences = await _geofenceRepository.GetIntersectingGeofencesAsync(currentPoint);
            var currentlyInsideIds = currentlyInsideGeofences.Select(g => g.Id).ToHashSet();

            // 3. Redis üzerinden "bu varlık az önce hangi poligonların içindeydi?" sorgusu (Infrastructure)
            var previouslyInsideIds = await _stateService.GetAssetCurrentGeofencesAsync(telemetry.AssetId);

            // --- KARAR MEKANİZMASI (Entry/Exit Detection) ---

            // ENTRY: Şu an listede var ama bir önceki listede yoktu
            var entries = currentlyInsideGeofences.Where(g => !previouslyInsideIds.Contains(g.Id)).ToList();

            // EXIT: Bir önceki listede vardı ama şu anki listede yok
            var exits = previouslyInsideIds.Where(id => !currentlyInsideIds.Contains(id)).ToList();

            // 4. Giriş İhlallerini İşle
            foreach (var geofence in entries)
            {
                if (geofence.AlertOnEntry)
                {
                    await CreateViolationRecord(telemetry, geofence.Id, "ENTRY", currentPoint);
                }
            }

            // 5. Çıkış İhlallerini İşle
            foreach (var geofenceId in exits)
            {
                // Çıkış uyarısı aktif mi kontrolü için geofence detayına bakılabilir
                var geofence = await _geofenceRepository.GetByIdAsync(geofenceId);
                if (geofence != null && geofence.AlertOnExit)
                {
                    await CreateViolationRecord(telemetry, geofenceId, "EXIT", currentPoint);
                }
            }

            // 6. Redis State'i Güncelle: Artık "önceki durum" şu anki durumdur.
            await _stateService.UpdateAssetGeofencesAsync(telemetry.AssetId, currentlyInsideIds);
        }

        private async Task CreateViolationRecord(TelemetryMessageDto telemetry, Guid geofenceId, string type, Point location)
        {
            var violation = new GeofenceViolation
            {
                Id = Guid.NewGuid(),
                AssetId = telemetry.AssetId,
                GeofenceId = geofenceId,
                ViolationType = type,
                Location = location,
                TimestampUtc = telemetry.TimestampUtc
            };

            await _violationRepository.AddAsync(violation);

            // Not: Burada opsiyonel olarak bir SignalR servisini tetikleyip 
            // tarayıcıya "Anlık Bildirim" gönderebiliriz.
        }
    }
}
