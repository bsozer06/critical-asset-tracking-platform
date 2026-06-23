using CriticalAssetTracking.Application.Contracts;
using CriticalAssetTracking.Application.Dtos;
using CriticalAssetTracking.Application.Interfaces;
using CriticalAssetTracking.Domain.Entities;
using NetTopologySuite.Geometries;

namespace CriticalAssetTracking.Application.Services
{
    public class GeofenceEngine: IGeofenceEngine
    {
        private readonly IGeofenceRepository _geofenceRepository;
        private readonly IGeofenceStateService _stateService;
        private readonly IViolationRepository _violationRepository;
        private readonly IViolationPublisher _violationPublisher;
        private readonly GeometryFactory _geometryFactory;

        public GeofenceEngine(
            IGeofenceRepository geofenceRepository,
            IGeofenceStateService stateService,
            IViolationRepository violationRepository,
            IViolationPublisher violationPublisher)
        {
            _geofenceRepository = geofenceRepository;
            _stateService = stateService;
            _violationRepository = violationRepository;
            _violationPublisher = violationPublisher;

            _geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
        }

        public async Task ProcessTelemetryAsync(TelemetryMessageDto telemetry)
        {
            var currentPoint = _geometryFactory.CreatePoint(new Coordinate(telemetry.Longitude, telemetry.Latitude));

            // 1. Redis'ten geofence listesini çek
            var geofences = await _stateService.GetAllGeofencesAsync();

            // 2. NetTopologySuite ile intersection kontrolü
            var currentlyInsideGeofences = geofences
                .Where(g => g.IsActive && g.Boundary != null && g.Boundary.Contains(currentPoint))
                .ToList();
            var currentlyInsideIds = currentlyInsideGeofences.Select(g => g.Id).ToHashSet();

            // 3. Redis üzerinden "bu varlık az önce hangi poligonların içindeydi?" sorgusu
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
                var geofence = geofences.FirstOrDefault(g => g.Id == geofenceId);
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

            var dto = new GeofenceViolationDto(
                telemetry.AssetId,
                geofenceId,
                type,
                telemetry.TimestampUtc
            );
            await _violationPublisher.PublishAsync(dto);
        }
    }
}
