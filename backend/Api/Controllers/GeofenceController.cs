using CriticalAssetTracking.Application.Dtos;
using CriticalAssetTracking.Application.Interfaces;
using CriticalAssetTracking.Domain.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NetTopologySuite.Geometries;

namespace CriticalAssetTracking.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GeofenceController : ControllerBase
    {
        private readonly IGeofenceRepository _repository;
        private readonly IGeofenceStateService _stateService;
        private readonly GeometryFactory _geometryFactory;

        public GeofenceController(IGeofenceRepository repository, IGeofenceStateService stateService)
        {
            _repository = repository;
            _stateService = stateService;
            _geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateGeofenceRequestDto request)
        {
            var coordinates = request.Coordinates
                .Select(c => new Coordinate(c.Longitude, c.Latitude))
                .ToList();

            // 2. Polygon must be closed !
            if (coordinates.First() != coordinates.Last())
            {
                coordinates.Add(coordinates.First());
            }

            // 3.create polygon object
            var polygon = _geometryFactory.CreatePolygon(coordinates.ToArray());

            var geofence = new Geofence
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                Description = request.Description,
                Boundary = polygon,
                AlertOnEntry = request.AlertOnEntry,
                AlertOnExit = request.AlertOnExit,
                IsActive = true,
                CreatedAtUtc = DateTime.UtcNow
            };

            await _repository.AddAsync(geofence);
            // Repository'de değişiklik olunca Redis güncelle
            await _stateService.AddOrUpdateGeofenceAsync(geofence);

            return Ok(geofence);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            // Önce Redis'ten dene
            var geofences = await _stateService.GetAllGeofencesAsync();
            if (geofences == null || geofences.Count == 0)
            {
                // Redis boşsa repository'den çekip Redis'e yaz
                geofences = await _repository.GetAllAsync();
                await _stateService.SetAllGeofencesAsync(geofences);
            }
            return Ok(geofences);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateGeofenceRequestDto request)
        {
            var existing = await _repository.GetByIdAsync(id);
            if (existing == null) return NotFound();

            var coordinates = request.Coordinates
                .Select(c => new Coordinate(c.Longitude, c.Latitude))
                .ToList();
            if (coordinates.First() != coordinates.Last())
                coordinates.Add(coordinates.First());

            var polygon = _geometryFactory.CreatePolygon(coordinates.ToArray());

            existing.Name = request.Name;
            existing.Description = request.Description;
            existing.Boundary = polygon;
            existing.AlertOnEntry = request.AlertOnEntry;
            existing.AlertOnExit = request.AlertOnExit;
            existing.IsActive = request.IsActive;

            await _repository.UpdateAsync(existing);
            await _stateService.AddOrUpdateGeofenceAsync(existing);
            return Ok(existing);
        }
        [HttpPatch("{id}")]
        public async Task<IActionResult> Patch(Guid id, [FromBody] PatchGeofenceRequestDto request)
        {
            var geofence = await _repository.GetByIdAsync(id);
            if (geofence == null) return NotFound();

            geofence.IsActive = request.IsActive;
            await _repository.UpdateAsync(geofence);
            await _stateService.AddOrUpdateGeofenceAsync(geofence);
            return Ok(geofence);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _repository.DeleteAsync(id);
            await _stateService.DeleteGeofenceAsync(id);
            return NoContent();
        }
    }
}
