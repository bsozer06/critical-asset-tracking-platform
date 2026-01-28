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
        private readonly GeometryFactory _geometryFactory;

        public GeofenceController(IGeofenceRepository repository)
        {
            _repository = repository;
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

            //return Ok(new { id = geofence.Id, message = "The virtual border has been successfully created." });
            return Ok(geofence);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var geofences = await _repository.GetAllAsync();
            // Not: Burada NTS Geometry'yi GeoJSON formatında dönmek için ek bir kütüphane gerekebilir
            return Ok(geofences);
        }
    }
}
